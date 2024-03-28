import { Locator, Page } from '@playwright/test'

class TrackPage {
  protected readonly playButton: Locator
  protected readonly previewButton: Locator
  protected readonly trackTitle: Locator

  constructor(page: Page) {
    this.playButton = page.getByRole('button', { name: /play/i })
    this.previewButton = page.getByRole('button', { name: /preview/i })
    this.trackTitle = page.getByRole('heading', { level: 1 })
  }
}
