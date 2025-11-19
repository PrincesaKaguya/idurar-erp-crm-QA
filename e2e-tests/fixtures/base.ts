import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomerPage } from '../pages/CustomerPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TaxesPage } from '../pages/TaxesPage';
import { InvoicePage } from '../pages/InvoicePage';

/**
 * Extend Playwright's base test with custom fixtures for Page Objects
 * This allows us to use page objects in tests with proper typing
 */
type CustomFixtures = {
  loginPage: LoginPage;
  customerPage: CustomerPage;
  dashboardPage: DashboardPage;
  taxesPage: TaxesPage;
  invoicePage: InvoicePage;
};

/**
 * Custom test fixture with page objects
 * Usage: import { test, expect } from '@fixtures/base';
 */
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  customerPage: async ({ page }, use) => {
    const customerPage = new CustomerPage(page);
    await use(customerPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  taxesPage: async ({ page }, use) => {
    const taxesPage = new TaxesPage(page);
    await use(taxesPage);
  },

  invoicePage: async ({ page }, use) => {
    const invoicePage = new InvoicePage(page);
    await use(invoicePage);
  },
});

export { expect } from '@playwright/test';
