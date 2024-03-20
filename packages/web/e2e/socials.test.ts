import { test, expect } from '@playwright/test'

const base64Entropy = 'YmRhYmE4MjRiNmUwMmFiNzg2OGM1YTJkZmRmYzdlOWY'

test.describe('socials tests', () => {
  test('should favorite a track', async ({ page }) => {
    await page.goto(`sebastian12/bachgavotte-1?login=${base64Entropy}`)
    const heading = page.getByRole('heading', {
      name: 'probers_track_do_not_delete',
      level: 1
    })
    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // locators
    const trackActions = page.getByRole('group', { name: /track actions/i })
    const favoriteButton = trackActions.getByRole('button', {
      name: /favorite$/i
    })
    const favoritedButton = trackActions.getByRole('button', {
      name: /favorited$/i
    })

    // Check that it starts unfavorited
    await expect(favoriteButton).toBeVisible()

    // Unfavorited => Favorite
    await favoriteButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await page.reload()

    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // Check that it persists after reload
    await expect(favoritedButton).toBeVisible()

    // Favorite => Unfavorite
    await favoritedButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await page.reload()

    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // Check that it persists after reload
    await expect(favoriteButton).toBeVisible()
  })

  test('should repost a track', async ({ page }) => {
    await page.goto(`sebastian12/bachgavotte-1?login=${base64Entropy}`)
    const heading = page.getByRole('heading', {
      name: 'probers_track_do_not_delete',
      level: 1
    })
    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // locators
    const trackActions = page.getByRole('group', { name: /track actions/i })
    const repostButton = trackActions.getByRole('button', { name: /repost$/i })
    const repostedButton = trackActions.getByRole('button', {
      name: /reposted$/i
    })

    // Check that it starts unfavorited
    await expect(repostButton).toBeVisible()

    // Unfavorited => Favorite
    await repostButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await page.reload()

    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // Check that it persists after reload
    await expect(repostedButton).toBeVisible()

    // Favorite => Unfavorite
    await repostedButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await page.reload()

    // Wait for heading
    await expect(heading).toBeAttached({ timeout: 10000 })

    // Check that it persists after reload
    await expect(repostButton).toBeVisible()
  })
})
