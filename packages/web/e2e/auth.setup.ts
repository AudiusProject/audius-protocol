import { test as setup, expect } from '@playwright/test'
import { navigate } from './helpers'

const base64Entropy = 'YmRhYmE4MjRiNmUwMmFiNzg2OGM1YTJkZmRmYzdlOWY'
const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await navigate(page, `/feed?login=${base64Entropy}`)
  const usernameLocator = page.getByText('probertest')
  await expect(usernameLocator).toBeVisible()
  await page.evaluate(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })
  await page.context().storageState({ path: authFile })
})
