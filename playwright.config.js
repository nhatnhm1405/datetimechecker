const { defineConfig, devices } = require('@playwright/test');
const fs = require('node:fs');

// Cho phép override khi chạy trong Docker (BASE_URL=http://app:8081)
const baseURL = process.env.BASE_URL || 'http://localhost:8081';
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
// Dùng channel được chỉ định; trên Windows fallback sang Edge nếu Chromium bundled chưa được cài.
const browserChannel = process.env.PLAYWRIGHT_CHANNEL
  || (process.platform === 'win32' && edgePaths.some(fs.existsSync) ? 'msedge' : undefined);

module.exports = defineConfig({
  testDir: './e2e',
  use: {
    headless: true,
    baseURL,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      testMatch: '*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        ...(browserChannel ? { channel: browserChannel } : {}),
      },
    },
  ],
});
