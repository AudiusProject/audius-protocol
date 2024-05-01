import { Page, expect, test as base } from '@playwright/test'

const SSR_HYDRATE_TIMEOUT = 60 * 1000

/**
 * The initial page load is slow because we need to wait for the
 * JS to hydrate, which takes a while. These wrappers wait until a specific
 * client-only element is mounted before considering the navigation complete.
 */
export const test = base.extend<{}>({
  page: async ({ page, context }, use) => {
    // On CI, force app to use dev mode so we test against
    // the local audius-compose stack
    if (process.env.CI) {
      await context.addInitScript(() => {
        if (!localStorage.getItem('FORCE_DEV')) {
          localStorage.clear()
          localStorage.setItem('FORCE_DEV', 'true')
        }
      })
    }

    const baseGoTo = page.goto.bind(page)
    page.goto = async (
      url: Parameters<Page['goto']>[0],
      options: Parameters<Page['goto']>[1] = {}
    ) => {
      const response = await baseGoTo(url, { waitUntil: 'load', ...options })
      await expect(page.getByTestId('app-hydrated')).toBeAttached({
        timeout: options.timeout ?? SSR_HYDRATE_TIMEOUT
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

// TODO: Remove this and fix bug in upload that doesn't wait for user
export const waitForUser = async (page: Page) => {
  await expect(page.getByRole('link', { name: /probertest/i })).toBeVisible({
    timeout: 15 * 1000
  })
}
