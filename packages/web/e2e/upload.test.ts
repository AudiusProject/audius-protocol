import { test, expect } from '@playwright/test'
import path from 'path'

const base64Entropy = 'YmRhYmE4MjRiNmUwMmFiNzg2OGM1YTJkZmRmYzdlOWY'

test.describe('upload', () => {
  test('should upload a track', async ({ page }) => {
    test.setTimeout(1000 * 60 * 20)
    await page.goto(`upload?login=${base64Entropy}`)
    const heading = page.getByRole('heading', {
      name: 'Upload Your Music',
      level: 1
    })
    await expect(heading).toBeVisible({ timeout: 10000 })
    await heading.click({ force: true })

    const trackTitle = `Test track ${Date.now()}`
    const trackDescription = 'Test description'
    const genre = 'Alternative'
    const mood = 'Easygoing'

    let fileChooserPromise = page.waitForEvent('filechooser')
    const uploadDropzone = page.getByTestId('upload-dropzone')
    await uploadDropzone.click()
    const trackChooser = await fileChooserPromise
    await trackChooser.setFiles(path.join(__dirname, 'files/track.mp3'))
    await page.getByRole('button', { name: /continue uploading/i }).click()

    await expect(
      page.getByRole('heading', { name: /complete your track/i, level: 1 })
    ).toBeVisible()

    // Add art
    fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /change/i }).click()
    await uploadDropzone.click()
    const artChooser = await fileChooserPromise
    await artChooser.setFiles(path.join(__dirname, 'files/track-artwork.jpeg'))

    // Title
    const titleTextBox = page.getByRole('textbox', { name: /track name/i })
    await titleTextBox.clear()
    await titleTextBox.fill(trackTitle)

    // Genre
    await page.getByRole('combobox', { name: /pick a genre/i }).click()
    await page.getByRole('option', { name: genre }).click()

    // Mood
    await page.getByRole('combobox', { name: /pick a mood/i }).click()
    await page.getByRole('option', { name: mood }).click()

    // Tags
    const tags = page.getByRole('textbox', { name: /tags/i })
    await tags.fill('tag1')
    await tags.press('Enter')
    await tags.fill('tag2')
    await tags.press('Tab')

    // Description
    await page
      .getByRole('textbox', { name: /description/i })
      .fill(trackDescription)

    // Remix Settings
    await page.getByRole('button', { name: /remix settings/i }).click()
    const remixSettingsModal = page.getByRole('dialog', {
      name: /remix settings/i
    })
    remixSettingsModal
      .getByRole('checkbox', { name: /identify as remix/i })
      .check()
    await remixSettingsModal
      .getByRole('textbox')
      .pressSequentially(
        'staging.audius.co/df/probers_remix_do_not_delete-2859'
      )
    const remixTrack = remixSettingsModal.getByText(
      'probers_remix_do_not_delete By df'
    )
    await expect(remixTrack).toBeVisible()
    await remixSettingsModal.getByRole('button', { name: /save/i }).click()

    // Access & Sale
    await page.getByRole('button', { name: /access & sale/i }).click()
    const accessAndSaleModal = page.getByRole('dialog', {
      name: /access & sale/i
    })

    // Assert remix alert
    const remixAlert = accessAndSaleModal.getByRole('alert').first()
    await expect(remixAlert).toHaveText(/this track is marked as a remix/i)

    // Make hidden
    const accessAndSaleRadioGroup = accessAndSaleModal.getByRole('radiogroup', {
      name: /access & sale/i
    })
    await accessAndSaleRadioGroup
      .getByRole('radio', { name: /hidden/i })
      .click()

    // Show share button
    const visibleTrackDetails = accessAndSaleRadioGroup.getByRole('group', {
      name: /visible track details/i
    })
    await visibleTrackDetails
      .getByRole('checkbox', { name: /share button/i })
      .click()
    accessAndSaleModal.getByRole('button', { name: /save/i }).click()

    // Complete upload
    await page.getByRole('button', { name: /complete upload/i }).click()
    const confirmUploadModal = page.getByRole('dialog', {
      name: /confirm upload/i
    })
    await confirmUploadModal.getByRole('button', { name: /upload/i }).click()

    // Assert uploading
    const uploadingHeading = page.getByRole('heading', {
      name: /uploading your track/i
    })
    await expect(uploadingHeading).toBeVisible()

    // Assert progress
    const progressBar = page.getByRole('progressbar', {
      name: /upload in progress/i
    })
    const getProgress = async () =>
      Number(await progressBar.getAttribute('aria-valuenow'))
    await expect.poll(getProgress).toBeGreaterThan(10)
    await expect
      .poll(getProgress, { timeout: 60 * 1000 * 5 })
      .toBeGreaterThan(50)

    // Assert finalizing
    const finalizing = page.getByText(/finalizing upload/i)
    await expect(finalizing).toBeAttached({ timeout: 1000 * 60 * 8 })

    // Assert success
    const successHeading = page.getByRole('heading', {
      name: /your upload is complete/i
    })
    await expect(successHeading).toBeAttached({ timeout: 1000 * 60 * 8 })

    // Vist track page
    await page.getByRole('link', { name: /visit track page/i }).click()

    // Assert title
    const trackHeading = page.getByRole('heading', {
      name: trackTitle,
      level: 1
    })
    await expect(trackHeading).toBeVisible()

    // Assert hidden
    const hidden = page.getByRole('heading', {
      name: /hidden track/i,
      level: 5
    })
    await expect(hidden.first()).toBeVisible()

    // Assert tagged
    const tag1 = page.getByRole('link', { name: /tag1/i })
    await expect(tag1).toBeVisible()
    const tag2 = page.getByRole('link', { name: /tag2/i })
    await expect(tag1).toBeVisible()

    // Assert description
    const description = page.getByRole('heading', {
      name: trackDescription,
      level: 3
    })
    await expect(description).toBeVisible()

    // Assert genre and mood
    await expect(page.getByText(genre)).toBeVisible()
    await expect(page.getByText(mood)).toBeVisible()
  })
})
