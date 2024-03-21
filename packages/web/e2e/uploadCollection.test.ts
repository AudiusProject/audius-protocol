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
    name: /uploading your.*/i
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

test.describe('upload collection', () => {
  test('should upload a playlist', async ({ page }) => {
    const timestamp = Date.now()
    const playlistName = `Test playlist ${timestamp}`
    const playlistDescription = 'Test description'
    const trackTitles = [
      `Test track 1 ${timestamp}`,
      `Test track 2 ${timestamp}`
    ]
    const genreInput = 'pro'
    const genre = 'Electronic - Progressive House'
    const mood = 'Tender'
    const tags = ['TAG1', 'TAG2']

    await page.goto(`upload?login=${base64Entropy}`)
    const heading = page.getByRole('heading', {
      name: 'Upload Your Music',
      level: 1
    })
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Dismiss push notifs modal
    await heading.click({ force: true })

    // Add tracks
    let fileChooserPromise = page.waitForEvent('filechooser')
    const uploadDropzone = page.getByTestId('upload-dropzone')
    await uploadDropzone.click()
    const trackChooser = await fileChooserPromise
    await trackChooser.setFiles([
      path.join(__dirname, 'files/track.mp3'),
      path.join(__dirname, 'files/track-2.mp3')
    ])
    const releaseTypeSegmentedControl = page.getByRole('radiogroup', {
      name: /release type/i
    })
    // Move the segemented control into view
    // TODO: Fix this bug
    await page.getByRole('main').evaluate((node) => node.scrollTo(0, 0))
    await releaseTypeSegmentedControl
      .getByRole('radio', { name: /playlist/i })
      .click({ force: true })
    await page.getByRole('button', { name: /continue uploading/i }).click()

    await expect(
      page.getByRole('heading', { name: /complete your playlist/i })
    ).toBeVisible()

    // Add art
    fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /add artwork/i }).click()
    await uploadDropzone.click()
    const artChooser = await fileChooserPromise
    await artChooser.setFiles(path.join(__dirname, 'files/track-artwork.jpeg'))

    // Collection Name
    await page
      .getByRole('textbox', { name: /playlist name/i })
      .fill(playlistName)

    // Genre
    const genreBox = page.getByRole('combobox', { name: /pick a genre/i })
    await genreBox.click()
    await genreBox.fill(genreInput)
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
      .getByRole('textbox', { name: /playlist description/i })
      .fill(playlistDescription)

    // Track Titles
    await page
      .getByRole('textbox', { name: /track name/i })
      .first()
      .fill(trackTitles[0])
    await page
      .getByRole('textbox', { name: /track name/i })
      .last()
      .fill(trackTitles[1])

    await completeUpload(page)

    // Vist collection page
    await page.getByRole('link', { name: /visit playlist page/i }).click()

    // Assert title
    const header = page.getByRole('heading', { name: playlistName, level: 1 })
    await expect(header).toBeVisible()

    // Assert description
    const description = page.getByText(playlistDescription)
    await expect(description).toBeVisible()

    // Assert track list
    const trackTable = page.getByRole('table')
    const trackOne = trackTable.getByRole('cell', { name: trackTitles[0] })
    const trackTwo = trackTable.getByRole('cell', { name: trackTitles[1] })
    await expect(trackOne).toBeVisible()
    await expect(trackTwo).toBeVisible()

    // Visit track 1
    await trackOne.getByRole('link', { name: trackTitles[0] }).click()

    // Assert tagged
    const tag1 = page.getByRole('link', { name: tags[0] })
    await expect(tag1).toBeVisible()
    const tag2 = page.getByRole('link', { name: tags[1] })
    await expect(tag1).toBeVisible()
    await expect(tag2).toBeVisible()

    // Assert genre and mood
    await expect(page.getByText(genre)).toBeVisible()
    await expect(page.getByText(mood)).toBeVisible()
  })
})
