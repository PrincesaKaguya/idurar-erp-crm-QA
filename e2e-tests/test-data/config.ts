/**
 * Test Data Configuration
 * 
 * Update these values with actual data from your test database
 * before running the tests.
 */

export const TestCustomers = {
  // Customer with unique email for testing single search results
  uniqueCustomer: {
    name: 'Test Customer Unique',
    email: 'unique.customer@example.com',
    phone: '+1234567890',
    address: '123 Test Street',
    country: 'United States',
  },
  
  // Additional customers for other test scenarios
  commonCustomer: {
    name: 'Common Customer',
    email: 'common@example.com',
    phone: '+0987654321',
    address: '456 Common Ave',
    country: 'Canada',
  },
};

export const TestUsers = {
  admin: {
    email: process.env.TEST_USER_EMAIL || 'admin@demo.com',
    password: process.env.TEST_USER_PASSWORD || 'admin123',
  },
};

/**
 * API Endpoints
 */
export const ApiEndpoints = {
  login: '/api/login',
  customerList: '/api/client/list',
  customerSearch: '/api/client/search',
  customerCreate: '/api/client/create',
  customerUpdate: '/api/client/update',
  customerDelete: '/api/client/delete',
};

/**
 * Timeout configurations (in milliseconds)
 */
export const Timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  apiCall: 15000,
};
