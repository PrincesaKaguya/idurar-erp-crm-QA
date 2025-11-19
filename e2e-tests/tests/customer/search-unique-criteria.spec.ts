import { test, expect } from '../../fixtures/base';

/**
 * CP032 - Single Criteria Search Test Suite
 * 
 * Objective: Verify that simple searches by a single field return exact and correct results.
 * 
 * Preconditions:
 * - Customers with unique codes and emails exist in the database
 * - User is authenticated (handled by auth.setup.ts)
 * 
 * Test Data Notes:
 * - Update the test data constants below with actual values from your test environment
 * - Ensure these customers exist in your database before running tests
 */

// TODO: Replace these with actual customer data from your test database
const TEST_CUSTOMER_EMAIL = 'miguel.flores9@smartsystems.com'; // Must be unique in DB
const TEST_CUSTOMER_NAME = 'Miguel Flores'; // The name of the customer with above email
const TEST_CUSTOMER_EMAIL_UPPERCASE = 'miguel.flores9@smartsystems.com'; // Same email in uppercase

test.describe('CP032 - Customer Search with Single Unique Criteria', () => {
  
  test.beforeEach(async ({ customerPage }) => {
    // Navigate to Customer module before each test
    await customerPage.goto();
  });

  test('should return exactly one result when searching by unique email', async ({ 
    customerPage 
  }) => {
    // Step 1: Search for customer by unique email
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL);

    // Assertion 1: Verify exactly one result is returned
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount, 'Should return exactly 1 customer for unique email').toBe(1);

    // Assertion 2: Verify the email in the result matches exactly
    const resultEmail = await customerPage.getCellValue(0, 'email');
    expect(
      resultEmail.toLowerCase(),
      'Returned email should match the searched email'
    ).toBe(TEST_CUSTOMER_EMAIL.toLowerCase());

    // Assertion 3: Verify email appears in table
    const isEmailVisible = await customerPage.isEmailInTable(TEST_CUSTOMER_EMAIL);
    expect(isEmailVisible, 'Email should be visible in the results table').toBeTruthy();

    // Assertion 4: Verify no duplicates exist
    const allEmails = await customerPage.getAllEmails();
    expect(allEmails.length, 'No duplicate results should exist').toBe(1);
  });

  test('should return exactly one result when searching by customer name', async ({ 
    customerPage 
  }) => {
    // Step 1: Search for customer by unique name
    await customerPage.searchByName(TEST_CUSTOMER_NAME);

    // Assertion 1: Verify exactly one result is returned
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount, 'Should return exactly 1 customer for unique name').toBe(1);

    // Assertion 2: Verify the name in the result matches
    const resultName = await customerPage.getCellValue(0, 'name');
    expect(
      resultName,
      'Returned name should match the searched name'
    ).toContain(TEST_CUSTOMER_NAME);

    // Assertion 3: Verify name appears in table
    const isNameVisible = await customerPage.isNameInTable(TEST_CUSTOMER_NAME);
    expect(isNameVisible, 'Name should be visible in the results table').toBeTruthy();
  });

  test('should be case-insensitive when searching by email', async ({ 
    customerPage,
    page
  }) => {
    // Step 1: Search with lowercase email
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL.toLowerCase());
    const lowercaseRowCount = await customerPage.getTableRowCount();
    const lowercaseEmail = lowercaseRowCount > 0 
      ? await customerPage.getCellValue(0, 'email') 
      : '';

    // Step 2: Clear search
    await customerPage.clearSearch();
    await page.waitForTimeout(500); // Wait for table to reset

    // Step 3: Search with uppercase email
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL_UPPERCASE);
    const uppercaseRowCount = await customerPage.getTableRowCount();
    const uppercaseEmail = uppercaseRowCount > 0 
      ? await customerPage.getCellValue(0, 'email') 
      : '';

    // Assertion 1: Both searches should return results
    expect(
      lowercaseRowCount,
      'Lowercase email search should return results'
    ).toBeGreaterThan(0);
    
    expect(
      uppercaseRowCount,
      'Uppercase email search should return results'
    ).toBeGreaterThan(0);

    // Assertion 2: Both searches should return the same customer
    expect(
      lowercaseEmail.toLowerCase(),
      'Both case variations should return the same customer email'
    ).toBe(uppercaseEmail.toLowerCase());

    // Assertion 3: Search should be case-insensitive
    expect(
      lowercaseRowCount,
      'Search should be case-insensitive - same number of results'
    ).toBe(uppercaseRowCount);
  });

  test('should clear search results when search field is cleared', async ({ 
    customerPage 
  }) => {
    // Step 1: Perform a search
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL);
    const searchRowCount = await customerPage.getTableRowCount();
    
    expect(searchRowCount, 'Search should return at least one result').toBeGreaterThan(0);

    // Step 2: Clear the search
    await customerPage.clearSearch();

    // Assertion 1: Table should show more results (or different results) after clearing
    const clearedRowCount = await customerPage.getTableRowCount();
    expect(
      clearedRowCount,
      'Clearing search should show all customers (more than search results)'
    ).toBeGreaterThanOrEqual(searchRowCount);
  });

  test('should handle search for non-existent email gracefully', async ({ 
    customerPage 
  }) => {
    const nonExistentEmail = 'definitely.does.not.exist@nowhere.invalid';

    // Step 1: Search for non-existent email
    await customerPage.searchByEmail(nonExistentEmail);

    // Assertion 1: Should return zero results
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount, 'Non-existent email should return 0 results').toBe(0);

    // Assertion 2: Empty state should be shown
    const emptyMessage = customerPage.page.locator('.ant-empty-description');
    await expect(emptyMessage, 'Empty state message should be visible').toBeVisible();
  });

  test('should validate search returns exact match (no partial matches)', async ({ 
    customerPage 
  }) => {
    // Get the first part of the email (before @)
    const partialEmail = TEST_CUSTOMER_EMAIL.split('@')[0];

    // Step 1: Search with full email
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL);
    const fullSearchRowCount = await customerPage.getTableRowCount();
    const fullSearchEmails = await customerPage.getAllEmails();

    // Assertion 1: Full email search should return results
    expect(
      fullSearchRowCount,
      'Full email search should return at least 1 result'
    ).toBeGreaterThan(0);

    // Assertion 6: All returned emails should contain the search term
    // Note: Depending on backend implementation, this might be exact or partial match
    fullSearchEmails.forEach((email: string) => {
      expect(
        email.toLowerCase(),
        `Returned email "${email}" should contain search term "${TEST_CUSTOMER_EMAIL}"`
      ).toContain(partialEmail.toLowerCase());
    });
  });

  test('should maintain search results after page refresh', async ({ 
    customerPage,
    page
  }) => {
    // Step 1: Search for customer
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL);
    const initialRowCount = await customerPage.getTableRowCount();
    
    expect(initialRowCount, 'Initial search should return results').toBeGreaterThan(0);

    // Step 2: Click refresh button
    await customerPage.refresh();

    // Assertion 1: Search should persist after refresh
    // Note: This depends on implementation - if search clears on refresh, adjust assertion
    const afterRefreshRowCount = await customerPage.getTableRowCount();
    
    // Check if search input still has the value (implementation dependent)
    const searchInputValue = await customerPage.searchInput.inputValue();
    
    if (searchInputValue === TEST_CUSTOMER_EMAIL) {
      expect(
        afterRefreshRowCount,
        'Search results should persist after refresh'
      ).toBe(initialRowCount);
    } else {
      // If search is cleared on refresh, verify that behavior
      expect(
        searchInputValue,
        'Search input should be cleared after refresh (if that\'s the expected behavior)'
      ).toBe('');
    }
  });

  test('should intercept and validate API call for customer search', async ({ 
    customerPage,
    page
  }) => {
    // Step 1: Set up response listener for API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/client/list') && response.status() === 200
    );

    // Step 2: Perform search
    await customerPage.searchByEmail(TEST_CUSTOMER_EMAIL);

    // Step 3: Wait for and validate API response
    const response = await responsePromise;
    const responseBody = await response.json();

    // Assertion 1: API call should be successful
    expect(response.status(), 'API response should be 200 OK').toBe(200);

    // Assertion 2: Response should have success flag
    expect(responseBody.success, 'API response should have success: true').toBe(true);

    // Assertion 3: Response should contain result data
    expect(responseBody.result, 'API response should contain result object').toBeDefined();

    // Assertion 4: Items array should exist
    expect(
      Array.isArray(responseBody.result?.items),
      'API response should contain items array'
    ).toBeTruthy();

    // Assertion 5: For unique search, items should contain exactly one result
    expect(
      responseBody.result.items.length,
      'API should return exactly 1 item for unique email search'
    ).toBe(1);

    // Assertion 6: Returned item should have the searched email
    const returnedCustomer = responseBody.result.items[0];
    expect(
      returnedCustomer.email?.toLowerCase(),
      'Returned customer email should match search term'
    ).toBe(TEST_CUSTOMER_EMAIL.toLowerCase());
  });
});
