import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Taxes Module
 * Handles all interactions with the taxes management page
 */
export class TaxesPage {
  readonly page: Page;
  
  // Header elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly refreshButton: Locator;
  readonly addNewButton: Locator;
  
  // Table elements
  readonly taxesTable: Locator;
  readonly tableRows: Locator;
  readonly tableHeaders: Locator;
  
  // Form elements (in panel)
  readonly taxNameInput: Locator;
  readonly taxValueInput: Locator;
  readonly enabledSwitch: Locator;
  readonly isDefaultSwitch: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  
  // Loading state
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header locators
    this.pageTitle = page.locator('.ant-page-header-heading-title');
    this.searchInput = page.locator('input[placeholder*="earch"]'); // Search input
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.addNewButton = page.getByRole('button', { name: /add new tax/i });
    
    // Table locators
    this.taxesTable = page.locator('.ant-table');
    this.tableRows = page.locator('.ant-table-tbody tr.ant-table-row');
    this.tableHeaders = page.locator('.ant-table-thead th');
    
    // Form locators - targeting visible form elements
    this.taxNameInput = page.locator('input[id="taxName"]').last();
    this.taxValueInput = page.locator('input[id="taxValue"]').last();
    // Switches: find the Form.Item that contains the input, then get the switch button
    this.enabledSwitch = page.locator('.ant-form-item').filter({ has: page.locator('input[id="enabled"]') }).locator('button[role="switch"]').last();
    this.isDefaultSwitch = page.locator('.ant-form-item').filter({ has: page.locator('input[id="isDefault"]') }).locator('button[role="switch"]').last();
    this.saveButton = page.getByRole('button', { name: /submit/i }).last();
    this.cancelButton = page.getByRole('button', { name: /cancel/i }).last();
    
    // Loading state
    this.loadingSpinner = page.locator('.ant-spin-spinning');
  }

  /**
   * Navigate to taxes page
   */
  async goto() {
    await this.page.goto('/taxes');
    await this.waitForTableToLoad();
  }

  /**
   * Wait for the taxes table to finish loading
   */
  async waitForTableToLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Spinner might not appear for fast loads
    });
  }

  /**
   * Click "Add New Tax" button to open the form
   */
  async clickAddNew() {
    // Close any open drawer first
    const closeButton = this.page.locator('.ant-drawer-close');
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true });
      await this.page.waitForTimeout(500);
    }
    
    await this.addNewButton.click({ force: true });
    // Wait for form panel to open
    await this.page.waitForTimeout(800);
  }

  /**
   * Fill the tax form with provided data
   * @param taxData - Object containing tax information
   */
  async fillTaxForm(taxData: {
    taxName: string;
    taxValue: number;
    enabled?: boolean;
    isDefault?: boolean;
  }) {
    // Fill tax name
    await this.taxNameInput.waitFor({ state: 'visible' });
    await this.taxNameInput.fill(taxData.taxName);
    
    // Fill tax value
    await this.taxValueInput.fill(taxData.taxValue.toString());
    
    // Set enabled switch if specified (default is true, so only toggle if false)
    if (taxData.enabled === false) {
      const isEnabled = await this.enabledSwitch.getAttribute('aria-checked');
      if (isEnabled === 'true') {
        await this.enabledSwitch.click();
      }
    }
    
    // Set isDefault switch if specified (default is false, so only toggle if true)
    if (taxData.isDefault === true) {
      const isDefaultChecked = await this.isDefaultSwitch.getAttribute('aria-checked');
      if (isDefaultChecked === 'false') {
        await this.isDefaultSwitch.click();
      }
    }
  }

  /**
   * Click save button and wait for response
   */
  async save() {
    // Wait for API response
    const createPromise = this.page.waitForResponse(response => 
      response.url().includes('/api/taxes/create') && response.status() === 200
    );
    
    await this.saveButton.click();
    await createPromise;
    
    // Wait for drawer to close
    await this.page.waitForTimeout(1000);
    const drawer = this.page.locator('.ant-drawer-open');
    if (await drawer.isVisible().catch(() => false)) {
      await this.page.waitForTimeout(1000);
    }
    
    // Wait for table to reload
    await this.waitForTableToLoad();
  }

  /**
   * Create a new tax with all steps
   * @param taxData - Tax information
   */
  async createTax(taxData: {
    taxName: string;
    taxValue: number;
    enabled?: boolean;
    isDefault?: boolean;
  }) {
    await this.clickAddNew();
    await this.fillTaxForm(taxData);
    await this.save();
  }

  /**
   * Get the number of rows in the table
   */
  async getTableRowCount(): Promise<number> {
    await this.taxesTable.waitFor({ state: 'visible' });
    
    const noDataMessage = this.page.locator('.ant-empty-description');
    if (await noDataMessage.isVisible().catch(() => false)) {
      return 0;
    }
    
    return await this.tableRows.count();
  }

  /**
   * Get data from a specific cell
   * @param rowIndex - 0-based row index
   * @param columnName - Name of the column
   */
  async getCellValue(rowIndex: number, columnName: string): Promise<string> {
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
   * Find a tax by name in the table
   * @param taxName - Name of the tax to find
   */
  async findTaxByName(taxName: string): Promise<number> {
    const rowCount = await this.getTableRowCount();
    
    for (let i = 0; i < rowCount; i++) {
      const name = await this.getCellValue(i, 'name');
      if (name.trim() === taxName) {
        return i;
      }
    }
    
    return -1; // Not found
  }

  /**
   * Check if a switch in a specific row is enabled
   * @param rowIndex - 0-based row index
   * @param switchType - 'enabled' or 'default'
   */
  async isSwitchEnabled(rowIndex: number, switchType: 'enabled' | 'default'): Promise<boolean> {
    const columnName = switchType === 'enabled' ? 'enabled' : 'default';
    const headers = await this.tableHeaders.allTextContents();
    const columnIndex = headers.findIndex(h => 
      h.toLowerCase().includes(columnName.toLowerCase())
    );
    
    if (columnIndex === -1) {
      throw new Error(`Column "${columnName}" not found`);
    }
    
    const cell = this.tableRows.nth(rowIndex).locator('td').nth(columnIndex);
    const switchElement = cell.locator('button[role="switch"]');
    
    const ariaChecked = await switchElement.getAttribute('aria-checked');
    return ariaChecked === 'true';
  }

  /**
   * Search for a tax by name
   * @param searchTerm - Term to search for
   */
  async search(searchTerm: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
    await this.waitForTableToLoad();
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    const clearButton = this.page.locator('.ant-input-clear-icon');
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
    }
    await this.waitForTableToLoad();
  }

  /**
   * Refresh the table
   */
  async refresh() {
    // Close any open drawer first
    const closeButton = this.page.locator('.ant-drawer-close');
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true });
      await this.page.waitForTimeout(500);
    }
    
    await this.refreshButton.click({ force: true });
    await this.waitForTableToLoad();
  }

  /**
   * Open actions menu for a specific row
   * @param rowIndex - 0-based row index
   */
  async openActionsMenu(rowIndex: number) {
    const actionsButton = this.tableRows.nth(rowIndex).locator('.anticon-edit, .anticon-ellipsis');
    await actionsButton.first().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Edit a tax by row index
   * @param rowIndex - 0-based row index
   */
  async clickEdit(rowIndex: number) {
    // Cerrar drawer si está abierto
    const drawerVisible = await this.page.locator('.ant-drawer.ant-drawer-open').isVisible().catch(() => false);
    if (drawerVisible) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }

    // Abrir el menú de acciones (3 puntos)
    const actionsButton = this.tableRows.nth(rowIndex).locator('.ant-dropdown-trigger');
    await actionsButton.click();
    await this.page.waitForTimeout(500);
    
    // Esperar a que aparezca el dropdown
    await this.page.locator('.ant-dropdown:visible').waitFor({ state: 'visible', timeout: 3000 });
    
    // Click en la opción "Edit" del menú
    const editOption = this.page.locator('.ant-dropdown:visible').getByText('Edit', { exact: true });
    await editOption.click();
    
    // Esperar a que el drawer de edición se abra y sea visible
    await this.page.locator('.ant-drawer.ant-drawer-open').waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(800);
  }

  /**
   * Update a tax with new data
   * @param rowIndex - 0-based row index of the tax to edit
   * @param newData - New tax data
   */
  async updateTax(rowIndex: number, newData: {
    taxName?: string;
    taxValue?: number;
    enabled?: boolean;
    isDefault?: boolean;
  }) {
    await this.clickEdit(rowIndex);
    
    // Wait for drawer to be fully visible
    const drawer = this.page.locator('.ant-drawer.ant-drawer-open');
    await drawer.waitFor({ state: 'visible' });
    
    // Use inputs within the visible drawer - usar .first() ya que hay 2 forms en el drawer
    const taxNameInput = drawer.locator('input[id="taxName"]').first();
    const taxValueInput = drawer.locator('input[id="taxValue"]').first();
    
    // Fill only the fields that are provided
    if (newData.taxName !== undefined) {
      await taxNameInput.clear();
      await taxNameInput.fill(newData.taxName);
    }
    
    if (newData.taxValue !== undefined) {
      await taxValueInput.clear();
      await taxValueInput.fill(newData.taxValue.toString());
    }
    
    if (newData.enabled !== undefined) {
      const enabledSwitch = drawer.locator('.ant-form-item')
        .filter({ has: this.page.locator('input[id="enabled"]') })
        .locator('button[role="switch"]').first();
      const isEnabled = await enabledSwitch.getAttribute('aria-checked');
      const currentlyEnabled = isEnabled === 'true';
      if (currentlyEnabled !== newData.enabled) {
        await enabledSwitch.click();
      }
    }
    
    if (newData.isDefault !== undefined) {
      const isDefaultSwitch = drawer.locator('.ant-form-item')
        .filter({ has: this.page.locator('input[id="isDefault"]') })
        .locator('button[role="switch"]').first();
      const isDefaultChecked = await isDefaultSwitch.getAttribute('aria-checked');
      const currentlyDefault = isDefaultChecked === 'true';
      if (currentlyDefault !== newData.isDefault) {
        await isDefaultSwitch.click();
      }
    }
    
    // Save using update endpoint
    const updatePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/taxes/update') && response.status() === 200
    );
    
    // Find submit button in visible drawer - use first() para el form visible con datos
    const submitButton = drawer.locator('button[type="submit"]').first();
    await submitButton.waitFor({ state: 'visible', timeout: 3000 });
    await submitButton.click();
    await updatePromise;
    
    // Wait for drawer to close
    await drawer.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
    
    // Wait for table to reload
    await this.waitForTableToLoad();
  }

  /**
   * Delete a tax by row index
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
    const confirmButton = this.page.getByRole('button', { name: /yes|confirm|ok/i });
    await confirmButton.click();
    await this.waitForTableToLoad();
  }
}
