import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Dashboard Page
 * Handles navigation and interactions on the main dashboard
 */
export class DashboardPage {
  readonly page: Page;
  readonly customerMenuItem: Locator;
  readonly invoiceMenuItem: Locator;
  readonly quoteMenuItem: Locator;
  readonly paymentMenuItem: Locator;
  readonly dashboardTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation menu items - using text-based locators for semantic selection
    this.customerMenuItem = page.getByRole('link', { name: /customers?/i });
    this.invoiceMenuItem = page.getByRole('link', { name: /invoices?/i });
    this.quoteMenuItem = page.getByRole('link', { name: /quote/i });
    this.paymentMenuItem = page.getByRole('link', { name: /payment/i });
    this.dashboardTitle = page.getByRole('heading', { name: /dashboard/i });
  }

  /**
   * Navigate to Customer module
   */
  async navigateToCustomers() {
    await this.customerMenuItem.click();
    await this.page.waitForURL(/\/customer/);
  }

  /**
   * Navigate to Invoice module
   */
  async navigateToInvoices() {
    await this.invoiceMenuItem.click();
    await this.page.waitForURL(/\/invoice/);
  }

  /**
   * Navigate to Quote module
   */
  async navigateToQuotes() {
    await this.quoteMenuItem.click();
    await this.page.waitForURL(/\/quote/);
  }

  /**
   * Navigate to Payment module
   */
  async navigateToPayments() {
    await this.paymentMenuItem.click();
    await this.page.waitForURL(/\/payment/);
  }

  /**
   * Check if user is on dashboard
   */
  async isDashboardVisible(): Promise<boolean> {
    return await this.dashboardTitle.isVisible();
  }
}
