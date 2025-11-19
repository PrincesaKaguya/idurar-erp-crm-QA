import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import path from 'path';

/**
 * Authentication setup file
 * This runs before all tests to authenticate and save the session
 * 
 * IMPORTANT: Update the credentials below with valid test user credentials
 */

const authFile = path.join(__dirname, '../test-data/auth.json');

// TODO: Replace these with your actual test credentials
// You can also use environment variables for security
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@admin.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // Navigate to login page
  await loginPage.goto();
  
  // Perform login
  await loginPage.login(TEST_USER_EMAIL, TEST_USER_PASSWORD, true);
  
  // Wait for successful navigation to dashboard
  await page.waitForURL(/\/(dashboard)?$/);
  
  // Optional: Verify we're actually logged in by checking for user-specific elements
  await page.waitForSelector('.ant-layout-sider', { timeout: 10000 });
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('✓ Authentication successful - session saved');
});
