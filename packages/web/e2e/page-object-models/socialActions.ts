import { Locator, Page, expect } from '@playwright/test'

export class SocialActions {
  private readonly page: Page
  public readonly favoriteButton: Locator
  public readonly unfavoriteButton: Locator
  public readonly repostButton: Locator
  public readonly unrepostButton: Locator

  constructor(page: Page) {
    this.page = page
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
    await expect(this.unfavoriteButton).toBeVisible()
  }

  async unfavorite() {
    // Favorited => Unfavorited
    await this.unfavoriteButton.click()

    // Wait for indexing, reload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await this.unfavoriteButton.page().reload()

    // Check that it persists after reload
    await expect(this.favoriteButton).toBeVisible()
  }

  async repost() {
    // Setup confirmation listener
    const confirmationPromise = this.page.waitForResponse(async (response) => {
      if (response.url().includes('block_confirmation')) {
        const json = await response.json()
        return json.data.block_passed
      }
    })

    // Unreposted => Reposted
    await this.repostButton.click()

    // Wait for indexing, reload
    await confirmationPromise
    await this.repostButton.page().reload()

    // Check that it persists after reload
    await expect(this.unrepostButton).toBeVisible()
  }

  async unrepost() {
    // Setup confirmation listener
    const confirmationPromise = this.page.waitForResponse(async (response) => {
      if (response.url().includes('block_confirmation')) {
        const json = await response.json()
        return json.data.block_passed
      }
    })

    // Reposted => Unreposted
    await this.unrepostButton.click()

    // Wait for indexing, reload
    await confirmationPromise
    await this.unrepostButton.page().reload()

    // Check that it persists after reload
    await expect(this.repostButton).toBeVisible()
  }
}
