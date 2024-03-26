import { expect } from '@playwright/test'

import { test } from './test'

test.describe('signOut', () => {
  test.beforeEach(async ({ page }) => {
    // await page.context().storageState()
  })

  test('should be able to sign out', async ({ page }) => {
    await page.goto('settings')

    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 })
    ).toBeVisible()
    await page.getByRole('button', { name: /sign out/i }).click()

    const confirmDialog = page.getByRole('dialog', { name: /hold up/i })
    await confirmDialog.getByRole('button', { name: /sign out/i }).click()

    await expect(page.getByText(/have an account?/i)).toBeVisible({
      timeout: 20000
    })
  })
})
