import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/results.json' }],
    ['html', { outputFolder: 'reports/html', open: 'never' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 20000,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      }
    }
  ]
});
