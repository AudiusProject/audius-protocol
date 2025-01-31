import { expect } from '@playwright/test'

import { getTrack2 } from './data'
import { SocialActions } from './page-object-models/socialActions'
import { test } from './test'

test('should favorite/unfavorite a track', async ({ page }) => {
  const { url } = getTrack2()
  await page.goto(url)

  const socialActions = new SocialActions(page)
  // On initial load, the favorite button will be showing. Make sure to wait for
  // the unfavorite button in case it comes, but allow failure.
  await expect(
    socialActions.unfavoriteButton,
    'Check for unfavorite (ok if fails)'
  )
    .toBeVisible()
    .catch(() => {})

  if (await socialActions.unfavoriteButton.isVisible()) {
    await socialActions.unfavorite()
    await socialActions.favorite()
  } else {
    await socialActions.favorite()
    await socialActions.unfavorite()
  }
})

test('should repost/unrepost a track', async ({ page }) => {
  const { url } = getTrack2()
  await page.goto(url)

  const socialActions = new SocialActions(page)
  // On initial load, the repost button will be showing. Make sure to wait for
  // the unrepost button in case it comes, but continue if it doesn't.
  await expect(socialActions.unrepostButton, 'Check for unrepost (ok if fails)')
    .toBeVisible()
    .catch(() => {})

  if (await socialActions.unrepostButton.isVisible()) {
    await socialActions.unrepost()
    await socialActions.repost()
  } else {
    await socialActions.repost()
    await socialActions.unrepost()
  }
})
