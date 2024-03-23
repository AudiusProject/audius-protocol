import { Page, expect } from '@playwright/test'

/**
 * The initial page.goto of each test is slow because we need to wait for the
 * JS bundle to do a bunch of stuff. This wrapper waits until the header is
 * visible before considering the navigation complete.
 */
export const navigate = async (
  page: Page,
  url: Parameters<Page['goto']>[0],
  options: Parameters<Page['goto']>[1] = {}
) => {
  await page.goto(url, { waitUntil: 'load', ...options })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: 30 * 1000
  })
}
