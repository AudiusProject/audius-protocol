import { test, expect } from '@playwright/test'
import { SocialActions } from './page-object-models/socialActions'
import { navigate } from './helpers'

test('should favorite/unfavorite a track', async ({ page }) => {
  await navigate(page, 'sebastian12/bachgavotte-1')

  const socialActions = new SocialActions(page)
  // Check that it has a favorite or unfavorite button
  await expect(
    socialActions.favoriteButton.or(socialActions.unfavoriteButton)
  ).toBeVisible()

  if (await socialActions.favoriteButton.isVisible()) {
    await socialActions.favorite()
    await socialActions.unfavorite()
  } else {
    await socialActions.unfavorite()
    await socialActions.favorite()
  }
})

test('should repost/unrepost a track', async ({ page }) => {
  await navigate(page, 'sebastian12/bachgavotte-1')

  const socialActions = new SocialActions(page)
  // Check that it has a favorite or unfavorite button
  await expect(
    socialActions.repostButton.or(socialActions.unrepostButton)
  ).toBeVisible()

  if (await socialActions.repostButton.isVisible()) {
    await socialActions.repost()
    await socialActions.unrepost()
  } else {
    await socialActions.unrepost()
    await socialActions.repost()
  }
})
