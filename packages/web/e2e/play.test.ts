import { test, expect } from '@playwright/test'

declare global {
  interface Window {
    audio: {
      paused: boolean
    }
  }
}

test('should play a trending track', async ({ page }) => {
  await page.goto('trending')
  const heading = page.getByRole('heading', {
    name: 'Trending',
    level: 1
  })
  await expect(heading).toBeVisible({ timeout: 10000 })

  const trendingList = page.getByRole('list', {
    name: /weekly trending tracks/i
  })
  const skeletons = trendingList.locator('[aria-busy]')
  const items = trendingList.getByRole('listitem')
  const playButton = page.getByRole('button', { name: /play track/i })
  const pauseButton = page.getByRole('button', { name: /pause track/i })

  const isPlayingWatcher = page.waitForFunction(() => !window.audio.paused)
  const isPausedWatcher = page.waitForFunction(() => window.audio.paused)

  await expect(skeletons).toHaveCount(0, { timeout: 10000 })
  await items.first().click()
  await expect(pauseButton).toBeAttached({ timeout: 5000 })
  await isPlayingWatcher
  await pauseButton.click()
  await expect(playButton).toBeAttached()
  await isPausedWatcher
})
