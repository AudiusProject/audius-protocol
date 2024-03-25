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

  const trendingList = page.getByRole('list', {
    name: /weekly trending tracks/i
  })
  const skeletons = trendingList.locator('[aria-busy]')
  const items = trendingList.getByRole('listitem')
  const playButton = page.getByRole('button', { name: /play track/i })
  const pauseButton = page.getByRole('button', { name: /pause track/i })
  const playHoverIcon = items.first().getByRole('img', { name: 'Play' })

  const isPlayingWatcher = page.waitForFunction(() => !window.audio.paused)
  const isPausedWatcher = page.waitForFunction(() => window.audio.paused)

  await expect(skeletons).toHaveCount(0)
  await playHoverIcon.hover()
  await expect(playHoverIcon).toBeVisible()
  await playHoverIcon.click()
  await expect(pauseButton).toBeVisible()
  await isPlayingWatcher
  await pauseButton.click()
  await expect(playButton).toBeVisible()
  await isPausedWatcher
})
