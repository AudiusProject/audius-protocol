import { Page, expect, test as base } from '@playwright/test'

/**
 * The initial page.goto of each test is slow because we need to wait for the
 * JS bundle to do a bunch of stuff. This wrapper waits until the header is
 * visible before considering the navigation complete.
 */
const navigate = async (
  page: Page,
  url: Parameters<Page['goto']>[0],
  options: Parameters<Page['goto']>[1] = {}
) => {
  console.log('navigated via helper')
  await page.goto(url, { waitUntil: 'load', ...options })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: 30 * 1000
  })
}

type Fixtures = {}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    /**
     * The initial page.goto of each test is slow because we need to wait for the
     * JS bundle to do a bunch of stuff. This wrapper waits until the header is
     * visible before considering the navigation complete.
     */
    const baseGoTo = page.goto.bind(page)
    page.goto = async (
      url: Parameters<Page['goto']>[0],
      options: Parameters<Page['goto']>[1] = {}
    ) => {
      const timeout = options.timeout ?? 60 * 1000
      console.log(
        `page.goto overridden, waiting for header (timeout: ${timeout}ms)`
      )
      const response = await baseGoTo(url, { waitUntil: 'load', ...options })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
        timeout
      })
      return response
    }
    await use(page)
  }
})
