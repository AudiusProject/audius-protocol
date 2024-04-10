import { expect } from '@playwright/test'

import { test } from './test'

declare global {
  interface Window {
    audio: {
      paused: boolean
    }
  }
}

test('should play a trending track', async ({ page }) => {
  await page.goto('trending')

  await expect(page.getByText('THIS DOESNT EXIST')).toBeVisible()
})
