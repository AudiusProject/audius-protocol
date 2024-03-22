import { Locator, Page, expect } from '@playwright/test'
import path from 'path'

export class EditTrackPage {
  private readonly artworkButton: Locator
  private readonly dropzoneFileInput: Locator
  private readonly titleInput: Locator
  private readonly genreBox: Locator
  private readonly genreList: Locator
  private readonly moodBox: Locator
  private readonly moodList: Locator
  private readonly tagsInput: Locator
  private readonly descriptionInput: Locator

  private readonly remixSettingsButton: Locator
  private readonly accessAndSaleSettingsButton: Locator
  private readonly attributionSettingsButton: Locator
  private readonly stemsAndDownloadsSettingsButton: Locator

  private readonly completeButton: Locator

  constructor(page: Page) {
    this.artworkButton = page.getByRole('button', { name: /artwork$/i })
    this.dropzoneFileInput = page
      .getByTestId('upload-dropzone')
      .locator('input[type=file]')
    this.titleInput = page.getByRole('textbox', { name: /track name/i })
    this.genreBox = page.getByRole('combobox', { name: /pick a genre/i })
    this.genreList = page
      .getByLabel(/pick a genre/i)
      .filter({ has: this.genreBox })
      .locator('.rc-virtual-list') // ant-d uses a virtualized list
    this.moodBox = page.getByRole('combobox', { name: /pick a mood/i })
    this.moodList = page
      .getByLabel(/pick a mood/i)
      .filter({ has: this.moodBox })
      .locator('.rc-virtual-list') // ant-d uses a virtualized list
    this.tagsInput = page.getByRole('textbox', { name: /tags/i })
    this.descriptionInput = page.getByRole('textbox', { name: /description/i })

    this.remixSettingsButton = page.getByRole('button', {
      name: /remix settings/i
    })
    this.accessAndSaleSettingsButton = page.getByRole('button', {
      name: /access & sale/i
    })
    this.attributionSettingsButton = page.getByRole('button', {
      name: /attribution/i
    })
    this.stemsAndDownloadsSettingsButton = page.getByRole('button', {
      name: /stems & downloads/i
    })

    this.completeButton = page.getByRole('button', { name: /complete upload/i })
  }

  async setArtwork(file: string) {
    await this.artworkButton.click()
    await this.dropzoneFileInput.setInputFiles(path.join(__dirname, file))
    await this.dropzoneFileInput.page().getByLabel('close popup').click()
  }

  async setTitle(title: string) {
    await this.titleInput.fill(title)
  }

  async setGenre(genre: string) {
    await this.genreBox.fill(genre)
    await this.genreList.getByRole('option', { name: genre }).click()
  }

  async setMood(mood: string) {
    await this.moodBox.fill(mood)
    await this.moodList.getByRole('option', { name: mood }).click()
  }

  async setTags(tags: string[]) {
    for (const tag of tags) {
      await this.tagsInput.fill(tag)
      await this.tagsInput.press('Enter')
    }
  }

  async setDescription(description: string) {
    await this.descriptionInput.fill(description)
  }

  async openRemixSettings() {
    await this.remixSettingsButton.click()
  }

  async openAccessAndSaleSettings() {
    await this.accessAndSaleSettingsButton.click()
  }

  async openAttributionSettings() {
    await this.attributionSettingsButton.click()
  }

  async openStemsAndDownloadsSettings() {
    await this.stemsAndDownloadsSettingsButton.click()
  }

  async complete() {
    await this.completeButton.click()
    const confirmUploadModal = this.completeButton.page().getByRole('dialog', {
      name: /confirm upload/i
    })
    await confirmUploadModal.getByRole('button', { name: /upload/i }).click()
  }
}

export class SelectPage {
  private readonly dropzoneFileInput: Locator
  private readonly releaseType: Locator
  private readonly continueButton: Locator

  constructor(page: Page) {
    this.dropzoneFileInput = page
      .getByTestId('upload-dropzone')
      .locator('input[type=file]')
    this.releaseType = page.getByRole('radiogroup', {
      name: /release type/i
    })
    this.continueButton = page.getByRole('button', {
      name: /continue uploading/i
    })
  }

  async setTracks(files: string[]) {
    await this.dropzoneFileInput.setInputFiles(
      files.map((file) => path.join(__dirname, file))
    )
  }

  async setReleaseType(type: 'Track' | 'Playlist' | 'Album') {
    await this.releaseType
      .getByRole('radio', { name: type })
      .check({ force: true })
  }

  async continue() {
    await this.continueButton.click()
  }
}

export class FinishPage {
  private readonly progressBar: Locator
  private readonly uploadingHeading: Locator
  private readonly finalizing: Locator
  private readonly successHeading: Locator

  constructor(page: Page, type: 'Track' | 'Tracks' | 'Album' | 'Playlist') {
    this.progressBar = page.getByRole('progressbar', {
      name: /upload in progress/i
    })
    this.uploadingHeading = page.getByRole('heading', {
      name: `Uploading Your ${type}`
    })
    this.finalizing = page.getByText(/finalizing upload/i)
    this.successHeading = page.getByRole('heading', {
      name: /your upload is complete/i
    })
  }

  async assertCompletes() {
    // Assert uploading
    await expect(this.uploadingHeading).toBeVisible()

    // Assert progress
    await this.assertProgress(1)
    await this.assertProgress(25)
    await this.assertProgress(50)
    await this.assertProgress(75)
    await this.assertProgress(99)

    // Assert finalizing
    await expect(this.finalizing).toBeVisible({ timeout: 20 * 1000 })

    // Assert success
    await expect(this.successHeading).toBeVisible({ timeout: 20 * 1000 })
  }

  private async assertProgress(progress: number) {
    await expect
      .poll(
        async () =>
          Number(await this.progressBar.getAttribute('aria-valuenow')),
        { timeout: 20 * 1000 }
      )
      .toBeGreaterThanOrEqual(progress)
  }
}
