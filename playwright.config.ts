import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests against the Firebase emulators. Run with `npm run e2e`, which starts the
 * emulators, or with `npx playwright test` if they are already running.
 */
export default defineConfig({
    testDir: 'e2e',
    workers: 1,
    globalSetup: './e2e/global-setup.ts',
    use: {
        baseURL: 'http://localhost:4300',
        channel: 'chrome',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npx ng serve --configuration emulators --port 4300',
        url: 'http://localhost:4300',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
    },
});
