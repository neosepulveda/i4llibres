import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { headless: true, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } },
  webServer: [
    { command: 'node tests/server.mjs empty 4322', url: 'http://127.0.0.1:4322', reuseExistingServer: false },
    { command: 'node tests/server.mjs populated 4323', url: 'http://127.0.0.1:4323', reuseExistingServer: false },
  ],
});
