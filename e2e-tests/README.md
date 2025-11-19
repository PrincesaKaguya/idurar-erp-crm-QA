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
npm run test:customer  # All customer tests
npm run test:taxes     # All taxes tests

# Run specific test case
npm run test:cp032  # Customer search
npm run test:cp033  # Create tax
npm run test:cp034  # Edit tax
npm run test:cp035  # Validate tax name
npm run test:cp036  # Delete tax
npm run test:cp037  # Validate tax value
npm run test:cp038  # Delete customer
npm run test:cp039  # Update customer
npm run test:cp040  # Update invoice (skipped)
npm run test:cp041  # Invoice search (skipped)

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
│   ├── CustomerPage.ts
│   ├── TaxesPage.ts
│   └── InvoicePage.ts
├── tests/             # Test specifications
│   ├── auth.setup.ts  # Authentication setup
│   ├── customer/      # Customer module tests
│   │   ├── search-unique-criteria.spec.ts (CP032)
│   │   ├── delete-customer.spec.ts (CP038)
│   │   ├── update-customer.spec.ts (CP039)
│   │   └── README-CP039.md
│   ├── taxes/         # Taxes module tests
│   │   ├── create-valid-tax.spec.ts (CP033)
│   │   ├── edit-tax.spec.ts (CP034)
│   │   ├── validate-required-name.spec.ts (CP035)
│   │   ├── delete-tax.spec.ts (CP036)
│   │   └── validate-value-range.spec.ts (CP037)
│   └── invoice/       # Invoice module tests
│       ├── update-invoice.spec.ts (CP040 - ⚠️ DISABLED)
│       ├── search-invoice.spec.ts (CP041 - ⚠️ DISABLED)
│       ├── README-CP040.md
│       └── README-CP041.md
├── test-data/         # Test data and auth state (gitignored)
│   └── auth.json
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 🧪 Test Suites

### Customer Module

#### CP032 - Customer Search with Single Unique Criteria ✅
**Objective:** Verify that simple searches by a single field return exact and correct results.

**Test Cases:** 8 tests
- Search by unique email (exact match)
- Search by customer name
- Case-insensitive search
- Clear search results
- Handle non-existent email
- Validate exact match (no partial)
- Maintain results after refresh
- API call validation

**Status:** ✅ All tests passing

#### CP038 - Delete Customer ✅
**Objective:** Verify customer deletion functionality.

**Test Cases:** 5 tests
- Delete customer successfully
- Confirm deletion modal
- Cancel deletion
- Verify customer removed from list
- Handle deletion errors

**Status:** ✅ All tests passing

#### CP039 - Update Customer (Simplified) ✅
**Objective:** Verify customer update UI functionality.

**Test Cases:** 5 tests
- Open edit form correctly
- Modify form fields
- Validate phone format
- Validate email format
- Cancel edit without saving

**Status:** ✅ All tests passing (6/6)
**Note:** Simplified approach - UI validation only, no persistence verification

**Documentation:** [README-CP039.md](tests/customer/README-CP039.md)

### Taxes Module

#### CP033 - Create Valid Tax ✅
**Objective:** Verify tax creation functionality.

**Test Cases:** Create tax with valid data

**Status:** ✅ Tests passing

#### CP034 - Edit Tax ✅
**Objective:** Verify tax editing functionality.

**Test Cases:** Edit existing tax record

**Status:** ✅ Tests passing

#### CP035 - Validate Required Name ✅
**Objective:** Verify name field validation.

**Test Cases:** Validate required field behavior

**Status:** ✅ Tests passing

#### CP036 - Delete Tax ✅
**Objective:** Verify tax deletion functionality.

**Test Cases:** Delete tax record

**Status:** ✅ Tests passing

#### CP037 - Validate Value Range ✅
**Objective:** Verify tax value range validation (0-100).

**Test Cases:** Validate min/max boundaries

**Status:** ✅ Tests passing

### Invoice Module

#### CP040 - Update Invoice ⚠️ DISABLED
**Objective:** Verify invoice update functionality.

**Test Cases:** 6 tests (IMPLEMENTED BUT DISABLED)
- Load update form with current data
- Modify editable fields
- Modify invoice items (add/remove/edit)
- Validate automatic calculations (subtotal, tax, total)
- Cancel edit without saving
- Validate required fields

**Status:** ⚠️ Tests disabled due to technical limitation
**Issue:** Invoice table uses Ant Design virtualization - rows not accessible to Playwright
**Solutions Proposed:**
1. Use API to obtain invoice IDs
2. Create invoice in setup and edit immediately
3. Disable virtualization in test mode
4. Implement programmatic scroll

**Documentation:** [README-CP040.md](tests/invoice/README-CP040.md) - Complete documentation with proposed solutions

**Page Object:** ✅ InvoicePage.ts fully implemented (20+ methods)

#### CP041 - Invoice Search ⚠️ DISABLED
**Objective:** Comprobar búsqueda de facturas por número, cliente y rango de fechas.

**Test Cases:** 6 tests (IMPLEMENTED BUT DISABLED)
- Functional search input field validation
- API call validation when searching
- Clear search functionality
- Partial client name search
- Search API parameters validation
- Maintain input value during typing

**Status:** ⚠️ Tests disabled due to technical limitation
**Issue:** Same as CP040 - Invoice page fails to load completely (table virtualization)
**Additional Limitation:** UI only supports client name search (NOT invoice number or date range)
  - searchConfig: `{ entity: 'client', displayLabels: ['name'], searchFields: 'name' }`
  - Invoice number search: NOT IMPLEMENTED in UI
  - Date range search: NOT IMPLEMENTED in UI

**Documentation:** [README-CP041.md](tests/invoice/README-CP041.md) - Full documentation with manual testing guide

**Page Object:** ✅ InvoicePage.ts extended with 5 search methods

---

### Test Summary

| Module   | Test Case | Status | Tests | Notes |
|----------|-----------|--------|-------|-------|
| Customer | CP032     | ✅     | 8/8   | Search functionality |
| Customer | CP038     | ✅     | 5/5   | Delete customer |
| Customer | CP039     | ✅     | 6/6   | Update customer (simplified) |
| Taxes    | CP033     | ✅     | -     | Create tax |
| Taxes    | CP034     | ✅     | -     | Edit tax |
| Taxes    | CP035     | ✅     | -     | Validate name required |
| Taxes    | CP036     | ✅     | -     | Delete tax |
| Taxes    | CP037     | ✅     | -     | Validate value range |
| Invoice  | CP040     | ⚠️     | 0/6   | Update invoice (disabled) |
| Invoice  | CP041     | ⚠️     | 0/6   | Invoice search (disabled) |

**Total:** 19+ passing tests, 12 disabled tests (Invoice module virtualization issue)

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
