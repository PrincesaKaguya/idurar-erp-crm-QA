import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Dashboard Page
 * Handles navigation and interactions on the main dashboard
 */
export class DashboardPage {
  readonly page: Page;
  
  // Navigation menu items
  readonly customerMenuItem: Locator;
  readonly invoiceMenuItem: Locator;
  readonly quoteMenuItem: Locator;
  readonly paymentMenuItem: Locator;
  readonly dashboardTitle: Locator;
  
  // Summary Cards (4 tarjetas superiores)
  readonly summaryCards: Locator;
  readonly invoicesSummaryCard: Locator;
  readonly quotesSummaryCard: Locator;
  readonly paidSummaryCard: Locator;
  readonly unpaidSummaryCard: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation menu items - using text-based locators for semantic selection
    this.customerMenuItem = page.getByRole('link', { name: /customers?/i });
    this.invoiceMenuItem = page.getByRole('link', { name: /invoices?/i });
    this.quoteMenuItem = page.getByRole('link', { name: /quote/i });
    this.paymentMenuItem = page.getByRole('link', { name: /payment/i });
    this.dashboardTitle = page.getByRole('heading', { name: /dashboard/i });
    
    // Summary Cards - usando estructura de columnas Ant Design
    this.summaryCards = page.locator('.gutter-row .whiteBox.shadow').first().locator('xpath=ancestor::div[contains(@class, "ant-row")]');
    this.invoicesSummaryCard = page.locator('.whiteBox.shadow').filter({ hasText: /invoices?/i }).first();
    this.quotesSummaryCard = page.locator('.whiteBox.shadow').filter({ hasText: /quote/i }).first();
    this.paidSummaryCard = page.locator('.whiteBox.shadow').filter({ hasText: /paid/i }).first();
    this.unpaidSummaryCard = page.locator('.whiteBox.shadow').filter({ hasText: /unpaid/i }).first();
  }
  
  /**
   * Navigate to dashboard page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
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
  
  /**
   * Get summary card title text
   * @param card - Locator of the summary card
   */
  async getSummaryCardTitle(card: Locator): Promise<string> {
    const titleElement = card.locator('h3').first();
    return await titleElement.textContent() || '';
  }
  
  /**
   * Get summary card prefix text (e.g., "This month", "Not Paid")
   * @param card - Locator of the summary card
   */
  async getSummaryCardPrefix(card: Locator): Promise<string> {
    const prefixElement = card.locator('.left').first();
    return await prefixElement.textContent() || '';
  }
  
  /**
   * Get summary card amount/value (formatted with currency)
   * @param card - Locator of the summary card
   */
  async getSummaryCardAmount(card: Locator): Promise<string> {
    const amountElement = card.locator('.ant-tag');
    return await amountElement.textContent() || '';
  }
  
  /**
   * Check if summary card is in loading state
   * @param card - Locator of the summary card
   */
  async isSummaryCardLoading(card: Locator): Promise<boolean> {
    const spinner = card.locator('.ant-spin');
    return await spinner.isVisible().catch(() => false);
  }
  
  /**
   * Wait for all summary cards to finish loading
   */
  async waitForSummaryCardsToLoad(): Promise<void> {
    // Wait for spinners to disappear
    await this.page.waitForSelector('.gutter-row .ant-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    // Wait a bit for data to render
    await this.page.waitForTimeout(1000);
  }
  
  /**
   * Get all summary card data
   * Returns array of objects with title, prefix, and amount
   */
  async getAllSummaryCardsData(): Promise<Array<{title: string, prefix: string, amount: string}>> {
    const cards = [
      this.invoicesSummaryCard,
      this.quotesSummaryCard,
      this.paidSummaryCard,
      this.unpaidSummaryCard
    ];
    
    const cardsData = [];
    for (const card of cards) {
      const title = await this.getSummaryCardTitle(card);
      const prefix = await this.getSummaryCardPrefix(card);
      const amount = await this.getSummaryCardAmount(card);
      cardsData.push({ title, prefix, amount });
    }
    
    return cardsData;
  }
  
  /**
   * Verify if amount is a valid currency format
   * @param amount - Amount string to validate
   */
  isValidCurrencyFormat(amount: string): boolean {
    // Matches formats like: $1,234.56 or €1.234,56 or 1,234.56 USD
    const currencyRegex = /^[\$€£¥]?\s*[\d,]+\.?\d*\s*[A-Z]{0,3}$/;
    return currencyRegex.test(amount.trim());
  }
  
  /**
   * Extract numeric value from currency string
   * @param currencyString - String with currency format (e.g., "$1,234.56")
   */
  extractNumericValue(currencyString: string): number {
    // Remove currency symbols, spaces, and letters
    const numericString = currencyString.replace(/[\$€£¥,\s]/g, '').replace(/[A-Z]/g, '');
    return parseFloat(numericString) || 0;
  }
}
