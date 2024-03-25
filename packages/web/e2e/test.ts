import { Page, expect, test as base } from '@playwright/test'

/**
 * The initial page load is slow because we need to wait for the
 * JS to hydrate, which takes a while. These wrappers wait until a specific
 * client-only element is mounted before considering the navigation complete.
 */
export const test = base.extend<{}>({
  page: async ({ page }, use) => {
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
      await expect(page.getByTestId('app-hydrated')).toBeAttached({
        timeout
      })
      return response
    }

    const baseReload = page.reload.bind(page)
    page.reload = async (options: Parameters<Page['reload']>[0]) => {
      const timeout = options?.timeout ?? 60 * 1000
      const reponse = await baseReload(options)
      await expect(page.getByTestId('app-hydrated')).toBeAttached({
        timeout
      })
      return reponse
    }
    await use(page)
  }
})
