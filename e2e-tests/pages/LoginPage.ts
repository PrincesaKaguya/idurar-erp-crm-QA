import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Handles all interactions with the login page
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators using semantic selectors based on actual IDURAR form with Ant Design
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByRole('textbox', { name: /password/i });
    this.loginButton = page.getByRole('button', { name: /log in/i });
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
    this.errorMessage = page.locator('.ant-message-error, .ant-alert-error');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Perform login with provided credentials
   * @param email - User email
   * @param password - User password
   * @param rememberMe - Whether to check "Remember Me"
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    // Wait for login API response
    const loginPromise = this.page.waitForResponse(response => 
      response.url().includes('/api/login') && response.status() === 200
    );
    
    await this.loginButton.click();
    await loginPromise;
    
    // Wait for navigation - accepts both / and /dashboard
    await this.page.waitForURL('**/');
    
    // Verify dashboard is loaded by checking for sidebar
    await this.page.waitForSelector('.ant-layout-sider', { timeout: 10000 });
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
