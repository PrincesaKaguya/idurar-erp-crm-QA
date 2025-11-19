# E2E Tests Setup and Execution Guide

## 📋 Initial Setup

### Step 1: Install Dependencies

```bash
cd e2e-tests
npm install
npx playwright install
```

### Step 2: Configure Test Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update with your credentials:
   ```env
   BASE_URL=http://localhost:3000
   TEST_USER_EMAIL=your-test-user@example.com
   TEST_USER_PASSWORD=your-password
   ```

### Step 3: Prepare Test Data

Before running tests, you need to create test data in your application:

#### Option A: Manual Creation (Recommended for first time)

1. Start the IDURAR application:
   ```bash
   # In the backend directory
   cd ../backend
   npm run dev
   
   # In another terminal, frontend directory
   cd ../frontend
   npm run dev
   ```

2. Open browser and navigate to `http://localhost:3000`

3. Login with admin credentials

4. Create a test customer with these details:
   - **Name**: Test Customer Unique
   - **Email**: unique.customer@example.com
   - **Phone**: +1234567890
   - **Country**: United States
   - **Address**: 123 Test Street

5. Update the test file with this data:
   - Edit: `tests/customer/search-unique-criteria.spec.ts`
   - Update: `TEST_CUSTOMER_EMAIL` and `TEST_CUSTOMER_NAME`

#### Option B: Use Existing Customer

1. Find a customer in your database with a unique email
2. Note the email and name
3. Update the constants in `tests/customer/search-unique-criteria.spec.ts`

### Step 4: Run Your First Test

```bash
# Run in UI mode (recommended for first time)
npm run test:ui

# Or run in headed mode (see browser)
npm run test:headed

# Or run in headless mode (faster)
npm test
```

## 🎯 Running Specific Tests

```bash
# Run only customer tests
npm run test:customer

# Run only CP032 test suite
npm run test:cp032

# Run specific test by name
npx playwright test --grep "should return exactly one result"

# Run in debug mode
npm run test:debug
```

## 📊 Viewing Results

After tests complete:

```bash
# Open HTML report
npm run show-report
```

The report shows:
- ✅ Passed tests
- ❌ Failed tests
- ⏭️ Skipped tests
- Screenshots and videos of failures
- Network activity
- Console logs

## 🔧 Troubleshooting

### Issue: "Authentication failed"

**Solution:**
1. Verify credentials in `.env` file
2. Try logging in manually with those credentials
3. Check if user has proper permissions
4. Delete `test-data/auth.json` and run setup again:
   ```bash
   npx playwright test --project=setup
   ```

### Issue: "Customer not found"

**Solution:**
1. Verify the customer exists in database
2. Check email and name match exactly
3. Update test constants with correct data

### Issue: "Timeout waiting for element"

**Solution:**
1. Ensure application is running
2. Check if BASE_URL is correct
3. Increase timeout in `playwright.config.ts`:
   ```typescript
   use: {
     actionTimeout: 30000, // Increase from 15000
   }
   ```

### Issue: "Tests fail on specific browser"

**Solution:**
1. Run only on one browser first:
   ```bash
   npx playwright test --project=chromium
   ```
2. Update browser in `playwright.config.ts` if needed

## 🧪 Test Execution Flow

1. **Setup Phase** (`auth.setup.ts`)
   - Navigates to login page
   - Performs authentication
   - Saves session state
   - Runs once before all tests

2. **Test Phase** (Each test file)
   - Uses saved authentication
   - Navigates to specific module
   - Executes test steps
   - Validates results
   - Takes screenshots on failure

3. **Cleanup Phase**
   - Automatic browser cleanup
   - Test artifacts saved

## 📈 Best Practices for Running Tests

### Development

```bash
# Use UI mode for development/debugging
npm run test:ui
```

Benefits:
- Visual test execution
- Step-through debugging
- DOM inspection
- Time-travel debugging

### CI/CD Pipeline

```bash
# Use headless mode
npm test
```

Benefits:
- Faster execution
- No GUI required
- Parallel execution
- Better for automation

### Before Committing

```bash
# Run all tests to ensure nothing breaks
npm test

# Check report for any issues
npm run show-report
```

## 🎨 Playwright UI Mode Features

When running `npm run test:ui`:

1. **Watch Mode**: Auto-rerun on file changes
2. **Pick Locator**: Help find correct selectors
3. **Time Travel**: See test execution step-by-step
4. **Network**: View all API calls
5. **Console**: See console.log output

## 📝 Next Steps

After successful test execution:

1. ✅ Verify all tests pass
2. 📝 Document any custom test data requirements
3. 🔄 Set up CI/CD integration (see README.md)
4. 🧪 Add more test cases as needed
5. 📊 Review reports regularly

## 🆘 Getting Help

If you encounter issues:

1. Check the HTML report for detailed error info
2. Run in debug mode: `npm run test:debug`
3. Check Playwright documentation: https://playwright.dev
4. Review the test file comments and TODOs
5. Verify application is running correctly

## 🎓 Learning Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Locators](https://playwright.dev/docs/locators)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Annotations](https://playwright.dev/docs/test-annotations)
