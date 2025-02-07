import { expect } from '@playwright/test'

import { getTrack } from './data'
import { test } from './test'

declare global {
  interface Window {
    audio: {
      paused: boolean
    }
  }
}

test('should play a track', async ({ page }) => {
  const { permalink, title } = getTrack()
  await page.goto(permalink)

  const heading = page.getByRole('heading', {
    name: title,
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
