import path from 'path'

import { test, expect, Page } from '@playwright/test'

const base64Entropy = 'YmRhYmE4MjRiNmUwMmFiNzg2OGM1YTJkZmRmYzdlOWY'

export const completeUpload = async (page: Page) => {
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
  await expect.poll(getProgress, { timeout: 60 * 1000 }).toBeGreaterThan(25)
  await expect.poll(getProgress, { timeout: 60 * 1000 }).toBeGreaterThan(50)
  await expect.poll(getProgress, { timeout: 60 * 1000 }).toBeGreaterThan(75)

  // Assert finalizing
  const finalizing = page.getByText(/finalizing upload/i)
  await expect(finalizing).toBeAttached({ timeout: 1000 * 60 })

  // Assert success
  const successHeading = page.getByRole('heading', {
    name: /your upload is complete/i
  })
  await expect(successHeading).toBeAttached({ timeout: 1000 * 60 })
}

test('should upload a single hidden, AI attributed track remix', async ({
  page
}) => {
  const trackTitle = `Test track ${Date.now()}`
  const trackDescription = 'Test description'
  const genre = 'Alternative'
  const mood = 'Easygoing'
  const tags = ['TAG1', 'TAG2']
  const remixUrl = 'staging.audius.co/sebastian12/probers_track_do_not_delete'
  const remixOption = 'probers_track_do_not_delete By sebastian12'
  const remixName = 'probers_track_do_not_delete'
  const aiAttributionInput = 'ai DO NOT DELETE'
  const aiAttributionName = 'probers ai DO NOT DELETE'
  const isrc = 'US-123-45-67890'
  const iswc = 'T-123456789-0'

  await page.goto(`upload?login=${base64Entropy}`)
  const heading = page.getByRole('heading', {
    name: 'Upload Your Music',
    level: 1
  })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // Dismiss push notifs modal
  await heading.click({ force: true })

  // Add tracks
  const trackFileInput = page
    .getByTestId('upload-dropzone')
    .locator('input[type=file]')
  await trackFileInput.setInputFiles(path.join(__dirname, 'files/track.wav'))

  const handle = await page
    .locator('input[type=file]')
    .evaluateHandle((node: HTMLInputElement) => node.files)
  console.log(handle, await handle.jsonValue())

  const continueButton = page.getByRole('button', {
    name: /continue uploading/i
  })
  await expect(continueButton).toBeVisible()
  await continueButton.click()

  await expect(
    page.getByRole('heading', { name: /complete your track/i, level: 1 })
  ).toBeVisible()

  // Add art
  await page.getByRole('button', { name: /change/i }).click()
  const artFileInput = page
    .getByTestId('upload-dropzone')
    .locator('input[type=file]')
  await artFileInput.setInputFiles(
    path.join(__dirname, 'files/track-artwork.jpeg')
  )

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
  const tagsInput = page.getByRole('textbox', { name: /tags/i })
  await tagsInput.fill(tags[0])
  await tagsInput.press('Enter')
  await tagsInput.fill(tags[1])
  await tagsInput.press('Tab')

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
  await remixSettingsModal.getByRole('textbox').pressSequentially(remixUrl)
  const remixTrack = remixSettingsModal.getByText(remixOption)
  await expect(remixTrack).toBeVisible()
  await remixSettingsModal.getByRole('button', { name: /save/i }).click()

  // Access & Sale
  await page.getByRole('button', { name: /access & sale/i }).click()
  const accessAndSaleModal = page.getByRole('dialog', {
    name: /access & sale/i
  })
  const remixAlert = accessAndSaleModal.getByRole('alert').first()
  await expect(remixAlert).toHaveText(/this track is marked as a remix/i)
  const accessAndSaleRadioGroup = accessAndSaleModal.getByRole('radiogroup', {
    name: /access & sale/i
  })
  await accessAndSaleRadioGroup.getByRole('radio', { name: /hidden/i }).click()
  const visibleTrackDetails = accessAndSaleRadioGroup.getByRole('group', {
    name: /visible track details/i
  })
  await visibleTrackDetails
    .getByRole('checkbox', { name: /share button/i })
    .click()
  accessAndSaleModal.getByRole('button', { name: /save/i }).click()

  // Attribution
  await page.getByRole('button', { name: /attribution/i }).click()
  const attributionModal = page.getByRole('dialog', { name: /attribution/i })
  await attributionModal
    .getByRole('checkbox', {
      name: /mark this track as ai generated/i
    })
    .click()
  await attributionModal
    .getByRole('combobox', { name: /find users/i })
    .fill(aiAttributionInput)
  await page.getByRole('option', { name: aiAttributionName }).click()
  await attributionModal.getByRole('textbox', { name: /isrc/i }).fill(isrc)
  await attributionModal.getByRole('textbox', { name: /iswc/i }).fill(iswc)
  const allowAttributionSegmentedControl = attributionModal.getByRole(
    'radiogroup',
    { name: /allow attribution/i }
  )
  await allowAttributionSegmentedControl
    .getByRole('radio', { name: /allow attribution/i })
    .click({ force: true })
  const commercialUseSegmentedControl = attributionModal.getByRole(
    'radiogroup',
    { name: /commercial use/i }
  )
  await commercialUseSegmentedControl
    .getByRole('radio', { name: /^commercial use/i })
    .click({ force: true })
  const derivativeWorksSegmentedControl = attributionModal.getByRole(
    'radiogroup',
    { name: /derivative works/i }
  )
  await derivativeWorksSegmentedControl
    .getByRole('radio', { name: /share-alike/i })
    .click({ force: true })
  await expect(
    attributionModal.getByRole('heading', {
      name: 'Attribution ShareAlike CC BY-SA'
    })
  ).toBeVisible()
  await attributionModal.getByRole('button', { name: /save/i }).click()

  // Complete upload
  await completeUpload(page)

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
  const tag1 = page.getByRole('link', { name: tags[0] })
  await expect(tag1).toBeVisible()
  const tag2 = page.getByRole('link', { name: tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // Assert description
  const description = page.getByRole('heading', {
    name: trackDescription,
    level: 3
  })
  await expect(description).toBeVisible()

  // Assert genre and mood
  await expect(page.getByText(genre)).toBeVisible()
  await expect(page.getByText(mood)).toBeVisible()

  // Assert shareable
  await expect(page.getByRole('button', { name: /share/i })).toBeVisible()

  // Assert remix
  await expect(page.getByText('ORIGINAL TRACK')).toBeVisible()
  await expect(page.getByRole('link', { name: remixName })).toBeVisible()

  // Assert AI generated
  await expect(page.getByText('generated with ai').first()).toBeVisible()

  // Assert ISRC
  // TODO

  // Assert ISWC
  // TODO

  // Assert license
  // TODO
})

test('should upload a premium track', async ({ page }) => {
  const trackTitle = `Test premium track ${Date.now()}`
  const genre = 'Alternative'
  const price = '1.05'
  const preview = '15'

  await page.goto(`upload?login=${base64Entropy}`)
  const heading = page.getByRole('heading', {
    name: 'Upload Your Music',
    level: 1
  })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // Dismiss push notifs modal
  await heading.click({ force: true })

  let fileChooserPromise = page.waitForEvent('filechooser')
  const uploadDropzone = page.getByTestId('upload-dropzone')
  await uploadDropzone.click()
  const trackChooser = await fileChooserPromise
  await trackChooser.setFiles(path.join(__dirname, 'files/track.wav'))

  const continueButton = page.getByRole('button', {
    name: /continue uploading/i
  })
  await expect(continueButton).toBeVisible()
  await continueButton.click()

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

  // Access & Sale
  await page.getByRole('button', { name: /access & sale/i }).click()
  const accessAndSaleModal = page.getByRole('dialog', {
    name: /access & sale/i
  })
  const accessAndSaleRadioGroup = accessAndSaleModal.getByRole('radiogroup', {
    name: /access & sale/i
  })
  await accessAndSaleRadioGroup
    .getByRole('radio', { name: /premium.*/i })
    .click()
  const priceBox = accessAndSaleRadioGroup.getByRole('textbox', {
    name: /cost to unlock/i
  })
  await priceBox.fill(price)
  const previewSecondsBox = accessAndSaleRadioGroup.getByRole('textbox', {
    name: /start time/i
  })
  await previewSecondsBox.fill(preview)
  await accessAndSaleModal.getByRole('button', { name: /save/i }).click()

  // Complete upload
  await completeUpload(page)

  // Vist track page
  await page.getByRole('link', { name: /visit track page/i }).click()

  // Assert title
  const trackHeading = page.getByRole('heading', {
    name: trackTitle,
    level: 1
  })
  await expect(trackHeading).toBeVisible()

  // Assert premium
  const premium = page.getByRole('heading', {
    name: /premium track/i,
    level: 5
  })
  await expect(premium.first()).toBeVisible()

  // Assert price
  await expect(page.getByText('$' + price)).toBeVisible()
})

test('should upload a single track with stems', async ({ page }) => {
  const trackTitle = `Test stems track ${Date.now()}`
  const genre = 'Alternative'

  await page.goto(`upload?login=${base64Entropy}`)
  const heading = page.getByRole('heading', {
    name: 'Upload Your Music',
    level: 1
  })
  await expect(heading).toBeVisible({ timeout: 10000 })

  // Dismiss push notifs modal
  await heading.click({ force: true })

  let fileChooserPromise = page.waitForEvent('filechooser')
  const uploadDropzone = page.getByTestId('upload-dropzone')
  await uploadDropzone.click()
  const trackChooser = await fileChooserPromise
  await trackChooser.setFiles(path.join(__dirname, 'files/track.wav'))

  const continueButton = page.getByRole('button', {
    name: /continue uploading/i
  })
  await expect(continueButton).toBeVisible()
  await continueButton.click()

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

  // Stems & Downloads
  await page.getByRole('button', { name: /stems & downloads/i }).click()
  const stemsAndDownloadsModal = page.getByRole('dialog', {
    name: /stems & downloads/i
  })
  await stemsAndDownloadsModal
    .getByRole('checkbox', { name: /allow full track download/i })
    .check()
  const stemDropzone = stemsAndDownloadsModal.getByTestId('upload-dropzone')

  const stemChooserPromise = page.waitForEvent('filechooser')
  await stemDropzone.click()
  const stemChooser = await stemChooserPromise
  await stemChooser.setFiles(path.join(__dirname, 'files/stem-1.mp3'))

  const stemChooserPromise2 = page.waitForEvent('filechooser')
  await stemDropzone.click()
  const stemChooser2 = await stemChooserPromise2
  await stemChooser2.setFiles(path.join(__dirname, 'files/stem-2.mp3'))

  await expect(
    stemsAndDownloadsModal.getByRole('button', { name: /select type/i })
  ).toHaveCount(2)
  await stemsAndDownloadsModal
    .getByRole('button', { name: /select type/i })
    .first()
    .click()
  await page
    .getByRole('listbox', { name: /select type/i })
    .getByText(/instrumental/i)
    .click()
  await stemsAndDownloadsModal
    .getByRole('button', { name: /select type/i })
    .last()
    .click()
  await page
    .getByRole('listbox', { name: /select type/i })
    .getByText(/lead vocals/i)
    .click()
  await stemsAndDownloadsModal.getByRole('button', { name: /save/i }).click()

  // Complete upload
  await completeUpload(page)

  // Vist track page
  await page.getByRole('link', { name: /visit track page/i }).click()

  // Assert title
  const trackHeading = page.getByRole('heading', {
    name: trackTitle,
    level: 1
  })
  await expect(trackHeading).toBeVisible()

  // Assert Stems & Downloads
  await page.getByRole('button', { name: /stems & downloads/i }).click()
  await expect(page.getByText(/full track/i)).toBeVisible()
  await expect(page.getByText(/stem-1.mp3/i)).toBeVisible()
  await expect(page.getByText(/instrumental/i)).toBeVisible()
  await expect(page.getByText(/stem-2.mp3/i)).toBeVisible()
  await expect(page.getByText(/lead vocals/i)).toBeVisible()
})
