# IDURAR ERP/CRM - E2E Test Suite

Automated End-to-End testing suite for IDURAR ERP/CRM using Playwright and TypeScript.

## 📋 Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- IDURAR ERP/CRM application running locally or accessible via URL

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd e2e-tests
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Configure Environment

Create a `.env` file in the `e2e-tests` directory:

```env
# Application URL
BASE_URL=http://localhost:3000

# Test User Credentials (Update with your test user)
TEST_USER_EMAIL=admin@demo.com
TEST_USER_PASSWORD=admin123
```

### 4. Update Test Data

Before running tests, update the test data in the test files:

- Edit `tests/customer/search-unique-criteria.spec.ts`
- Replace `TEST_CUSTOMER_EMAIL` and `TEST_CUSTOMER_NAME` with actual data from your test database

### 5. Run Tests

```bash
# Run all tests in headless mode
npm test

# Run tests with browser UI
npm run test:headed

# Run tests with Playwright UI mode (recommended for debugging)
npm run test:ui

# Run specific test suite
npm run test:customer

# Run specific test case
npm run test:cp032

# Debug mode (step through tests)
npm run test:debug
```

## 📁 Project Structure

```
e2e-tests/
├── fixtures/           # Custom Playwright fixtures
│   └── base.ts        # Extended test with page objects
├── pages/             # Page Object Models
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── CustomerPage.ts
├── tests/             # Test specifications
│   ├── auth.setup.ts  # Authentication setup
│   └── customer/
│       └── search-unique-criteria.spec.ts
├── test-data/         # Test data and auth state (gitignored)
│   └── auth.json
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 🧪 Test Suites

### CP032 - Customer Search with Single Unique Criteria

**Objective:** Verify that simple searches by a single field return exact and correct results.

**Test Cases:**
1. ✅ Should return exactly one result when searching by unique email
2. ✅ Should return exactly one result when searching by customer name
3. ✅ Should be case-insensitive when searching by email
4. ✅ Should clear search results when search field is cleared
5. ✅ Should handle search for non-existent email gracefully
6. ✅ Should validate search returns exact match (no partial matches)
7. ✅ Should maintain search results after page refresh
8. ✅ Should intercept and validate API call for customer search

## 📝 Writing Tests

### Using Page Objects

```typescript
import { test, expect } from '../../fixtures/base';

test('example test', async ({ customerPage }) => {
  // Navigate to customer page
  await customerPage.goto();
  
  // Perform search
  await customerPage.searchByEmail('test@example.com');
  
  // Assertions
  const rowCount = await customerPage.getTableRowCount();
  expect(rowCount).toBe(1);
});
```

### Best Practices

1. **Use semantic locators**: Prefer `getByRole()`, `getByText()`, `getByPlaceholder()` over CSS selectors
2. **Wait for states**: Use `waitForTableToLoad()` and proper wait conditions
3. **Descriptive test names**: Use clear, descriptive names in English
4. **Independent tests**: Each test should be independent and not rely on others
5. **Clean test data**: Use unique, identifiable test data
6. **API validation**: Include API response validation where applicable

## 🔍 Debugging

### Visual Debugging with UI Mode

```bash
npm run test:ui
```

This opens the Playwright Test UI where you can:
- See all tests
- Run tests individually
- Watch tests execute step-by-step
- Inspect DOM snapshots
- View network requests

### Debug Mode

```bash
npm run test:debug
```

### View Test Reports

After running tests:

```bash
npm run show-report
```

## 🎯 Test Data Management

### Required Test Data

For the Customer Search tests (CP032), you need:

1. **Unique Customer Email**: A customer with a unique email address
2. **Customer Name**: The name of that customer
3. **Test User Credentials**: Valid login credentials

### Creating Test Data

Option 1: Manually create via UI
Option 2: Use backend API to seed data
Option 3: Create setup script (recommended for CI/CD)

## 🔐 Authentication

Authentication is handled automatically using Playwright's `storageState` feature:

1. `auth.setup.ts` runs before all tests
2. Logs in with test credentials
3. Saves session to `test-data/auth.json`
4. All tests reuse this authenticated session

## 🌐 Multi-Browser Testing

Tests run on multiple browsers by default:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

Disable browsers in `playwright.config.ts` if needed.

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd e2e-tests
          npm ci
      
      - name: Install Playwright
        run: |
          cd e2e-tests
          npx playwright install --with-deps
      
      - name: Run tests
        run: |
          cd e2e-tests
          npm test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e-tests/playwright-report/
```

## 🐛 Troubleshooting

### Tests failing with "Authentication required"

- Check `test-data/auth.json` exists
- Verify credentials in `.env` or `auth.setup.ts`
- Run setup manually: `npx playwright test --project=setup`

### Timeouts

- Increase timeout in `playwright.config.ts`
- Check if application is running
- Verify BASE_URL is correct

### Element not found

- Check if UI has changed
- Update locators in Page Objects
- Use Playwright Inspector: `npm run test:debug`

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [IDURAR Documentation](https://github.com/idurar/idurar-erp-crm)

## 📄 License

Same license as the main IDURAR project.
