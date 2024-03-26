import { Locator, Page, expect } from '@playwright/test'
import path from 'path'

class BaseEditPage {
  protected readonly artworkButton: Locator
  protected readonly dropzoneFileInput: Locator
  protected readonly titleInput: Locator
  protected readonly genreBox: Locator
  protected readonly genreList: Locator
  protected readonly moodBox: Locator
  protected readonly moodList: Locator
  protected readonly tagsInput: Locator
  protected readonly descriptionInput: Locator
  protected readonly completeButton: Locator

  constructor(page: Page) {
    this.artworkButton = page.getByRole('button', { name: /artwork$/i })
    this.dropzoneFileInput = page
      .getByTestId('upload-dropzone')
      .locator('input[type=file]')
    this.genreBox = page.getByRole('combobox', { name: /pick a genre/i })
    this.genreList = page
      .getByLabel(/pick a genre/i)
      .locator('.rc-virtual-list') // ant-d uses a virtualized list
    this.moodBox = page.getByRole('combobox', { name: /pick a mood/i })
    this.moodList = page.getByLabel(/pick a mood/i).locator('.rc-virtual-list') // ant-d uses a virtualized list
    this.tagsInput = page.getByRole('textbox', { name: /tags/i })
    this.descriptionInput = page.getByRole('textbox', { name: /description/i })
    this.completeButton = page.getByRole('button', { name: /complete upload/i })
  }

  async setArtwork(file: string) {
    await this.artworkButton.click()
    await this.dropzoneFileInput.setInputFiles(
      path.join(__dirname, '..', 'files', file)
    )
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

  async complete() {
    await this.completeButton.click()
    const confirmUploadModal = this.completeButton.page().getByRole('dialog', {
      name: /confirm upload/i
    })
    await confirmUploadModal.getByRole('button', { name: /upload/i }).click()
  }
}

export class EditTrackPage extends BaseEditPage {
  protected readonly titleInput: Locator
  private readonly remixSettingsButton: Locator
  private readonly accessAndSaleSettingsButton: Locator
  private readonly attributionSettingsButton: Locator
  private readonly stemsAndDownloadsSettingsButton: Locator

  constructor(page: Page) {
    super(page)
    this.titleInput = page.getByRole('textbox', { name: /track name/i })
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
}

export class EditPlaylistPage extends BaseEditPage {
  protected readonly titleInput: Locator
  protected readonly trackList: Locator

  constructor(page: Page) {
    super(page)
    this.titleInput = page.getByRole('textbox', { name: /playlist name/i })
    this.trackList = page.getByRole('list', { name: /track list/i })
  }

  async setTrackName(index: number, name: string) {
    const trackItem = this.trackList.getByRole('listitem').nth(index)
    const nameInput = trackItem.getByRole('textbox', { name: /track name/i })
    await nameInput.fill(name)
  }

  async setTrackDetails(
    index: number,
    {
      name,
      genre,
      mood,
      tags
    }: {
      name?: string
      genre?: string
      mood?: string
      tags?: string[]
    }
  ) {
    const trackItem = this.trackList.getByRole('listitem').nth(index)
    const checkbox = trackItem.getByRole('checkbox', {
      name: /override details for this track/i
    })
    if (genre || mood || tags) {
      await checkbox.check()
    }
    if (name) {
      await this.setTrackName(index, name)
    }
    if (genre) {
      await this.setTrackGenre(index, genre)
    }
    if (mood) {
      await this.setTrackMood(index, mood)
    }
    if (tags) {
      await this.addTrackTags(index, tags)
    }
  }

  private async setTrackGenre(index: number, genre: string) {
    const trackItem = this.trackList.getByRole('listitem').nth(index)
    const genreBox = trackItem.getByRole('combobox', { name: /pick a genre/i })
    const genreList = genreBox
      .page()
      .getByLabel(/pick a genre/i)
      .locator('.rc-virtual-list') // ant-d uses a virtualized list
    await genreBox.fill(genre)
    await genreList.getByRole('option', { name: genre }).click()
  }

  private async setTrackMood(index: number, mood: string) {
    const trackItem = this.trackList.getByRole('listitem').nth(index)
    const moodBox = trackItem.getByRole('combobox', { name: /pick a mood/i })
    const moodList = moodBox
      .page()
      .getByLabel(/pick a mood/i)
      .locator('.rc-virtual-list') // ant-d uses a virtualized list
    await moodBox.fill(mood)
    await moodList.getByRole('option', { name: mood }).click()
  }

  private async addTrackTags(index: number, tags: string[]) {
    const trackItem = this.trackList.getByRole('listitem').nth(index)
    const tagsInput = trackItem.getByRole('textbox', { name: /tags/i })
    for (const tag of tags) {
      await tagsInput.fill(tag)
      await tagsInput.press('Enter')
    }
  }
}

export class EditAlbumPage extends EditPlaylistPage {
  protected readonly titleInput: Locator

  constructor(page: Page) {
    super(page)
    this.titleInput = page.getByRole('textbox', { name: /album name/i })
  }
}

export class UploadSelectPage {
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

  async setTracks(...files: string[]) {
    await this.dropzoneFileInput.setInputFiles(
      files.map((file) => path.join(__dirname, '..', 'files', file))
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

export class UploadFinishPage {
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
    await this.assertProgress(10)
    await this.assertProgress(20)
    await this.assertProgress(30)
    await this.assertProgress(40)
    await this.assertProgress(50)
    await this.assertProgress(60)
    await this.assertProgress(70)
    await this.assertProgress(80)
    await this.assertProgress(90)
    await this.assertProgress(99)

    // Assert finalizing
    await expect(this.finalizing).toBeVisible({ timeout: 60 * 1000 })

    // Assert success
    await expect(this.successHeading).toBeVisible({ timeout: 90 * 1000 })
  }

  private async assertProgress(progress: number) {
    await expect
      .poll(
        async () =>
          Number(await this.progressBar.getAttribute('aria-valuenow')),
        { timeout: 60 * 1000 }
      )
      .toBeGreaterThanOrEqual(progress)
  }
}
