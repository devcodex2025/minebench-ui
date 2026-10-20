import { defineConfig, devices } from '@playwright/test';

const backendOrigin = 'http://127.0.0.1:4310';
const projects = [
  { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }
];

if (process.env.ACCOUNT_E2E_WEBKIT === '1') {
  projects.push(
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } }
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://localhost:3443',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure'
  },
  projects,
  webServer: [
    {
      command: 'node tests/e2e/mock-account-backend.cjs',
      url: `${backendOrigin}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000
    },
    {
      command: 'node tests/e2e/start-standalone.cjs',
      url: 'http://127.0.0.1:3200/account/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        MINING_STATISTICS_ENABLED: 'true',
        ACCOUNT_WEB_ORIGIN: 'https://localhost:3443',
        ACCOUNT_IAM_ORIGIN: backendOrigin,
        ACCOUNT_STATISTICS_ORIGIN: backendOrigin,
        HOSTNAME: '127.0.0.1',
        PORT: '3200'
      }
    },
    {
      command: 'node tests/e2e/https-proxy.cjs',
      url: 'https://127.0.0.1:3443/account/login',
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000
    }
  ]
});
