import fs from 'fs'

import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// Set this to false to avoid seeding data every time locally if
// running against local stack
const reseedEachRun = process.env.RESEED_EACH_RUN !== 'false'
const authFileExists = fs.existsSync('playwright/.auth/user.json')
const runAgainstLocalStack = process.env.RUN_AGAINST_LOCAL_STACK === 'true'

const getTestDependencies = () => {
  if (runAgainstLocalStack) {
    if (reseedEachRun || !authFileExists) {
      return ['seed', 'setup']
    }
    return []
  }

  return authFileExists ? [] : ['setup']
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['junit', { outputFile: 'report.xml', outputDir: 'playwright-report' }],
        ['html', { open: 'never' }],
        ['line'],
        ['blob']
      ]
    : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-all-retries',

    /* Set the default timeout for actions like "click" */
    actionTimeout: 10 * 1000
  },

  /* Total timeout for individual tests */
  timeout: 5 * 60 * 1000,

  /* Timeout for each assertion */
  expect: {
    timeout: 10 * 1000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'seed',
      testMatch: /.*\.seed.ts/
    },
    {
      name: 'setup',
      testMatch: /.*\.setup.ts/,
      dependencies: runAgainstLocalStack ? ['seed'] : []
    },
    {
      name: 'chromium',
      dependencies: getTestDependencies(),
      testIgnore: /.*\.(setup|seed).ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      }
    }

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: runAgainstLocalStack
      ? 'npm run preview:dev'
      : 'npm run preview:stage',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000 * 15
  }
})
