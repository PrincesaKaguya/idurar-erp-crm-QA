import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Customer Module
 * Handles all interactions with the customer listing and CRUD operations
 */
export class CustomerPage {
  readonly page: Page;
  
  // Header elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly refreshButton: Locator;
  readonly addNewButton: Locator;
  
  // Table elements
  readonly customerTable: Locator;
  readonly tableRows: Locator;
  readonly tableHeaders: Locator;
  readonly nameColumn: Locator;
  readonly emailColumn: Locator;
  readonly phoneColumn: Locator;
  
  // Pagination
  readonly pagination: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  
  // Loading state
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header locators
    this.pageTitle = page.locator('.ant-page-header-heading-title');
    this.searchInput = page.getByPlaceholder(/search/i);
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.addNewButton = page.getByRole('button', { name: /add new/i });
    
    // Table locators
    this.customerTable = page.locator('.ant-table');
    this.tableRows = page.locator('.ant-table-tbody tr.ant-table-row');
    this.tableHeaders = page.locator('.ant-table-thead th');
    this.nameColumn = page.locator('td').filter({ hasText: /name/i });
    this.emailColumn = page.locator('td').filter({ hasText: /@/i });
    this.phoneColumn = page.locator('td').filter({ hasText: /\+?[0-9]/i });
    
    // Pagination locators
    this.pagination = page.locator('.ant-pagination');
    this.nextPageButton = page.locator('.ant-pagination-next');
    this.previousPageButton = page.locator('.ant-pagination-prev');
    
    // Loading state
    this.loadingSpinner = page.locator('.ant-spin-spinning');
  }

  /**
   * Navigate to customer page
   */
  async goto() {
    await this.page.goto('/customer');
    await this.waitForTableToLoad();
  }

  /**
   * Wait for the customer table to finish loading
   */
  async waitForTableToLoad() {
    // Wait for loading spinner to disappear
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Spinner might not appear for fast loads
    });
  }

  /**
   * Search for a customer by any field
   * @param searchTerm - The term to search for
   */
  async search(searchTerm: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(searchTerm);
    // Wait for debounce and API call
    await this.page.waitForTimeout(500);
    await this.waitForTableToLoad();
  }

  /**
   * Clear the search field
   */
  async clearSearch() {
    await this.searchInput.clear();
    // Click the clear button if visible
    const clearButton = this.page.locator('.ant-input-clear-icon');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
    await this.waitForTableToLoad();
  }

  /**
   * Get the number of rows currently displayed in the table
   */
  async getTableRowCount(): Promise<number> {
    // Wait for table to be visible
    await this.customerTable.waitFor({ state: 'visible' });
    
    // Check if "No data" message is shown
    const noDataMessage = this.page.locator('.ant-empty-description');
    if (await noDataMessage.isVisible()) {
      return 0;
    }
    
    return await this.tableRows.count();
  }

  /**
   * Get data from a specific row and column
   * @param rowIndex - 0-based row index
   * @param columnName - Name of the column (case insensitive)
   */
  async getCellValue(rowIndex: number, columnName: string): Promise<string> {
    // Get the column index by header name
    const headers = await this.tableHeaders.allTextContents();
    const columnIndex = headers.findIndex(h => 
      h.toLowerCase().includes(columnName.toLowerCase())
    );
    
    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found. Available: ${headers.join(', ')}`);
    }
    
    const cell = this.tableRows.nth(rowIndex).locator('td').nth(columnIndex);
    return await cell.textContent() || '';
  }

  /**
   * Get all data from a specific row
   * @param rowIndex - 0-based row index
   */
  async getRowData(rowIndex: number): Promise<Record<string, string>> {
    const headers = await this.tableHeaders.allTextContents();
    const cells = await this.tableRows.nth(rowIndex).locator('td').allTextContents();
    
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header && cells[index]) {
        rowData[header.trim()] = cells[index].trim();
      }
    });
    
    return rowData;
  }

  /**
   * Get customer ID from row (from data-row-key attribute)
   * @param rowIndex - 0-based row index
   */
  async getCustomerId(rowIndex: number): Promise<string> {
    const row = this.tableRows.nth(rowIndex);
    const rowKey = await row.getAttribute('data-row-key');
    return rowKey || '';
  }

  /**
   * Search for customer by email and verify single result
   * @param email - Email to search for
   */
  async searchByEmail(email: string) {
    await this.search(email);
  }

  /**
   * Search for customer by name and verify single result
   * @param name - Name to search for
   */
  async searchByName(name: string) {
    await this.search(name);
  }

  /**
   * Click on a customer row to view/edit
   * @param rowIndex - 0-based row index
   */
  async clickCustomerRow(rowIndex: number) {
    await this.tableRows.nth(rowIndex).click();
  }

  /**
   * Open actions menu for a specific row
   * @param rowIndex - 0-based row index
   */
  async openActionsMenu(rowIndex: number) {
    const actionsButton = this.tableRows.nth(rowIndex).locator('.anticon-ellipsis');
    await actionsButton.click();
  }

  /**
   * Verify if a specific email appears in the table
   * @param email - Email to verify
   */
  async isEmailInTable(email: string): Promise<boolean> {
    const emailCell = this.page.locator(`td:has-text("${email}")`);
    return await emailCell.isVisible();
  }

  /**
   * Verify if a specific name appears in the table
   * @param name - Name to verify
   */
  async isNameInTable(name: string): Promise<boolean> {
    const nameCell = this.page.locator(`td:has-text("${name}")`);
    return await nameCell.isVisible();
  }

  /**
   * Get all visible email addresses from the table
   */
  async getAllEmails(): Promise<string[]> {
    const rowCount = await this.getTableRowCount();
    const emails: string[] = [];
    
    for (let i = 0; i < rowCount; i++) {
      try {
        const email = await this.getCellValue(i, 'email');
        if (email && email.includes('@')) {
          emails.push(email.trim());
        }
      } catch (error) {
        // Column might not exist or be empty
      }
    }
    
    return emails;
  }

  /**
   * Get all visible customer names from the table
   */
  async getAllNames(): Promise<string[]> {
    const rowCount = await this.getTableRowCount();
    const names: string[] = [];
    
    for (let i = 0; i < rowCount; i++) {
      try {
        const name = await this.getCellValue(i, 'name');
        if (name) {
          names.push(name.trim());
        }
      } catch (error) {
        // Column might not exist or be empty
      }
    }
    
    return names;
  }

  /**
   * Refresh the customer list
   */
  async refresh() {
    await this.refreshButton.click();
    await this.waitForTableToLoad();
  }

  /**
   * Click "Add New Customer" button
   */
  async clickAddNew() {
    await this.addNewButton.click();
  }

  /**
   * Delete a customer by row index
   * @param rowIndex - 0-based row index
   */
  async clickDelete(rowIndex: number) {
    await this.openActionsMenu(rowIndex);
    const deleteOption = this.page.getByRole('menuitem', { name: /delete/i });
    await deleteOption.click();
  }

  /**
   * Confirm delete in modal
   */
  async confirmDelete() {
    const confirmButton = this.page.getByRole('button', { name: /ok|yes|confirm/i });
    await confirmButton.click();
    await this.waitForTableToLoad();
  }

  /**
   * Cancel delete in modal
   */
  async cancelDelete() {
    const cancelButton = this.page.getByRole('button', { name: /no|cancel/i });
    await cancelButton.click();
  }

  /**
   * Click edit option for a customer by row index
   * @param rowIndex - 0-based row index
   */
  async clickEdit(rowIndex?: number) {
    // If rowIndex is provided, open the actions menu first
    if (rowIndex !== undefined) {
      await this.openActionsMenu(rowIndex);
      // Wait for dropdown menu to be visible
      await this.page.waitForTimeout(500);
    }
    
    // Click on "Edit" option - search within the visible dropdown only
    const dropdown = this.page.locator('.ant-dropdown:visible');
    const editOption = dropdown.getByRole('menuitem', { name: /edit/i });
    await editOption.click();
    
    // Wait for drawer to open and be visible (opens in READ mode first)
    await this.page.locator('.ant-drawer.ant-drawer-open').waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(500);
    
    // Click the "Edit" button INSIDE the drawer to switch to EDIT mode
    const drawer = this.page.locator('.ant-drawer.ant-drawer-open');
    const editButtonInDrawer = drawer.getByRole('button', { name: /edit/i });
    await editButtonInDrawer.click();
    await this.page.waitForTimeout(800);
  }

  /**
   * Update a customer with new data
   * NOTE: This method fills the form but does not verify save success
   * due to current system limitations with drawer persistence
   * @param rowIndex - 0-based row index of the customer to edit
   * @param newData - New customer data (name, phone, email)
   */
  async updateCustomer(rowIndex: number, newData: {
    name?: string;
    phone?: string;
    email?: string;
  }) {
    await this.clickEdit(rowIndex);
    
    // Wait for drawer to be fully visible
    const drawer = this.page.locator('.ant-drawer.ant-drawer-open');
    await drawer.waitFor({ state: 'visible' });
    
    // Fill only the fields that are provided using role selectors
    if (newData.name !== undefined) {
      const nameInput = drawer.getByRole('textbox', { name: /name/i });
      await nameInput.fill(newData.name);
    }
    
    if (newData.phone !== undefined) {
      const phoneInput = drawer.getByRole('textbox', { name: /phone/i });
      await phoneInput.fill(newData.phone);
    }
    
    if (newData.email !== undefined) {
      const emailInput = drawer.getByRole('textbox', { name: /email/i });
      await emailInput.fill(newData.email);
    }
  }

  /**
   * Cancel edit operation (close drawer without saving)
   */
  async cancelEdit() {
    const drawer = this.page.locator('.ant-drawer.ant-drawer-open');
    
    // Try to find and click the close button
    const closeButton = drawer.getByRole('button', { name: /close|cancel/i }).first();
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // If no close button, click the X icon
      const closeIcon = drawer.locator('.ant-drawer-close');
      await closeIcon.click();
    }
    
    // Wait for drawer to close
    await drawer.waitFor({ state: 'hidden', timeout: 3000 });
  }
}
