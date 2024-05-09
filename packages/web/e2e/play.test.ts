import { expect } from '@playwright/test'
import { test } from './test'
import { getTrack } from './data'

declare global {
  interface Window {
    audio: {
      paused: boolean
    }
  }
}

test('should play a track', async ({ page }) => {
  const { url, name } = getTrack()
  await page.goto(url)

  const heading = page.getByRole('heading', {
    name,
    level: 1
  })

  await expect(heading).toBeVisible()

  const playButton = page.getByText('play', { exact: true })
  const pauseButton = page.getByText('pause', { exact: true })

  const isPlayingWatcher = page.waitForFunction(() => !window.audio.paused)
  const isPausedWatcher = page.waitForFunction(() => window.audio.paused)

  await playButton.click()
  await expect(pauseButton).toBeVisible()
  await isPlayingWatcher
  await pauseButton.click()
  await expect(playButton).toBeVisible()
  await isPausedWatcher
})
