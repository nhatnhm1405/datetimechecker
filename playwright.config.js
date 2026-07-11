const { defineConfig, devices } = require('@playwright/test');

// Cho phép override khi chạy trong Docker (BASE_URL=http://app:8081)
const baseURL = process.env.BASE_URL || 'http://localhost:8081';

module.exports = defineConfig({
  testDir: './e2e',
  use: {
    headless: true,
    baseURL,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      testMatch: 'test.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
