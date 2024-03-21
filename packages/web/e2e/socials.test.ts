import { test, expect, Page, Locator } from '@playwright/test'

const base64Entropy = 'YmRhYmE4MjRiNmUwMmFiNzg2OGM1YTJkZmRmYzdlOWY'

class SocialActions {
  public readonly favoriteButton: Locator
  public readonly unfavoriteButton: Locator
  public readonly repostButton: Locator
  public readonly unrepostButton: Locator

  constructor(page: Page) {
    const trackActions = page.getByRole('group', {
      name: /track actions/i
    })
    this.favoriteButton = trackActions.getByRole('button', {
      name: /favorite$/i
    })
    this.unfavoriteButton = trackActions.getByRole('button', {
      name: /favorited$/i
    })
    this.repostButton = trackActions.getByRole('button', {
      name: /repost$/i
    })
    this.unrepostButton = trackActions.getByRole('button', {
      name: /reposted$/i
    })
  }

  async favorite() {
    // Unfavorited => Favorited
    await this.favoriteButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.favoriteButton.page().reload()

    // Check that it persists after reload
    await expect(this.unfavoriteButton).toBeVisible({ timeout: 10 * 1000 })
  }

  async unfavorite() {
    // Favorited => Unfavorited
    await this.unfavoriteButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.unfavoriteButton.page().reload()

    // Check that it persists after reload
    await expect(this.favoriteButton).toBeVisible({ timeout: 10 * 1000 })
  }

  async repost() {
    // Unreposted => Reposted
    await this.repostButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.repostButton.page().reload()

    // Check that it persists after reload
    await expect(this.unrepostButton).toBeVisible({ timeout: 10 * 1000 })
  }

  async unrepost() {
    // Reposted => Unreposted
    await this.unrepostButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.unrepostButton.page().reload()

    // Check that it persists after reload
    await expect(this.repostButton).toBeVisible({ timeout: 10 * 1000 })
  }
}

test('should favorite/unfavorite a track', async ({ page }) => {
  await page.goto(`sebastian12/bachgavotte-1?login=${base64Entropy}`)
  const heading = page.getByRole('heading', {
    name: 'probers_track_do_not_delete',
    level: 1
  })
  // Wait for heading
  await expect(heading).toBeAttached({ timeout: 10000 })

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
  await page.goto(`sebastian12/bachgavotte-1?login=${base64Entropy}`)
  const heading = page.getByRole('heading', {
    name: 'probers_track_do_not_delete',
    level: 1
  })
  // Wait for heading
  await expect(heading).toBeAttached({ timeout: 10000 })

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
