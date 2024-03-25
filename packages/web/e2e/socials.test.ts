import { expect } from '@playwright/test'
import { SocialActions } from './page-object-models/socialActions'
import { test } from './test'

test('should favorite/unfavorite a track', async ({ page }) => {
  await page.goto('sebastian12/bachgavotte-1')

  const socialActions = new SocialActions(page)
  await expect(
    socialActions.favoriteButton.or(socialActions.unfavoriteButton)
  ).toBeVisible()

  if (await socialActions.unfavoriteButton.isVisible()) {
    await socialActions.unfavorite()
    await socialActions.favorite()
  } else {
    await socialActions.favorite()
    await socialActions.unfavorite()
  }
})

test('should repost/unrepost a track', async ({ page }) => {
  await page.goto('sebastian12/bachgavotte-1')

  const socialActions = new SocialActions(page)
  await expect(
    socialActions.repostButton.or(socialActions.unrepostButton)
  ).toBeVisible()

  if (await socialActions.unrepostButton.isVisible()) {
    await socialActions.unrepost()
    await socialActions.repost()
  } else {
    await socialActions.repost()
    await socialActions.unrepost()
  }
})
