import { expect } from '@playwright/test'
import {
  EditTrackPage,
  UploadFinishPage,
  UploadSelectPage
} from './page-object-models/upload'
import {
  RemixSettingsModal,
  AccessAndSaleModal,
  AttributionModal,
  StemsAndDownloadsModal
} from './page-object-models/modals'
import { test } from './test'

test('should upload a remix, hidden, AI-attributed track', async ({ page }) => {
  const trackTitle = `Test track ${Date.now()}`
  const trackDescription = 'Test description'
  const genre = 'Alternative'
  const mood = 'Easygoing'
  const tags = ['TAG1', 'TAG2']
  const remixUrl = 'staging.audius.co/sebastian12/probers_track_do_not_delete'
  const remixName = 'probers_track_do_not_delete'
  const aiAttributionName = 'probers ai DO NOT DELETE'
  const isrc = 'US-123-45-67890'
  const iswc = 'T-123456789-0'

  await page.goto('upload')

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your track/i, level: 1 })
  ).toBeVisible()

  const editPage = new EditTrackPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(trackTitle)
  await editPage.setDescription(trackDescription)
  await editPage.setGenre(genre)
  await editPage.setMood(mood)
  await editPage.setTags(tags)

  await editPage.openRemixSettings()
  const remixSettingsModal = new RemixSettingsModal(page)
  await remixSettingsModal.setAsRemixOf(remixUrl, remixName)
  await remixSettingsModal.save()

  await editPage.openAccessAndSaleSettings()
  const accessAndSaleModal = new AccessAndSaleModal(page)
  expect(accessAndSaleModal.remixAlert).toBeVisible()
  // Only public and hidden allowed for remixes
  await expect(
    accessAndSaleModal.locator.getByRole('radio', { disabled: false })
  ).toHaveCount(2)
  await accessAndSaleModal.setHidden({ ['Share Button']: true })
  await accessAndSaleModal.save()

  await editPage.openAttributionSettings()
  const attributionModal = new AttributionModal(page)
  await attributionModal.markAsAIGenerated(aiAttributionName)
  await attributionModal.setISRC(isrc)
  await attributionModal.setISWC(iswc)
  await attributionModal.setAllowAttribution(true)
  await attributionModal.setAllowCommercialUse(true)
  await attributionModal.setDerivativeWorks('Allowed')
  await attributionModal.save()

  await editPage.complete()

  const uploadingPage = new UploadFinishPage(page, 'Track')
  await uploadingPage.assertCompletes()

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
  const previewSeconds = '15'

  await page.goto('upload')

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3')
  await selectPage.continue()

  const editPage = new EditTrackPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(trackTitle)
  await editPage.setGenre(genre)

  await editPage.openAccessAndSaleSettings()
  const accessAndSaleModal = new AccessAndSaleModal(page)
  await accessAndSaleModal.setPremium({ price, previewSeconds })
  await accessAndSaleModal.save()

  await editPage.complete()

  const uploadingPage = new UploadFinishPage(page, 'Track')
  await uploadingPage.assertCompletes()

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

test('should upload a track with free stems', async ({ page }) => {
  const trackTitle = `Test stems track ${Date.now()}`
  const genre = 'Alternative'

  await page.goto('upload')

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3')
  await selectPage.continue()

  const editPage = new EditTrackPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(trackTitle)
  await editPage.setGenre(genre)

  await editPage.openStemsAndDownloadsSettings()
  const stemsAndDownloadsModal = new StemsAndDownloadsModal(page)
  await stemsAndDownloadsModal.setAllowTrackDownload(true)
  await stemsAndDownloadsModal.setStems([
    { filename: 'stem-1.mp3', type: 'Instrumental' },
    { filename: 'stem-2.mp3', type: 'Lead Vocals' }
  ])
  await stemsAndDownloadsModal.save()

  await editPage.complete()

  const uploadingPage = new UploadFinishPage(page, 'Track')
  await uploadingPage.assertCompletes()

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
