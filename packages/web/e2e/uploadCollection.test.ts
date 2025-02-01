import { expect } from '@playwright/test'

import {
  UploadEditAlbumPage,
  EditPlaylistPage,
  UploadFinishPage,
  UploadSelectPage
} from './page-object-models/upload'
import { test, waitForUser } from './test'
import { openCleanBrowser } from './utils'

// TODO: Enable track2 again, it was causing failures
// https://linear.app/audius/issue/INF-699/fix-uploadcollectiontestts-to-support-multiple-files
test('should upload a playlist', async ({ page }) => {
  const timestamp = Date.now()
  const playlistName = `Test playlist ${timestamp}`
  const playlistDescription = 'Test description'
  const trackOneDetails = { name: `Test track 1 ${timestamp}` }
  // const trackTwoDetails = {
  //   name: `Test track 2 ${timestamp}`
  // }
  // const trackDetails = [trackOneDetails, trackTwoDetails]
  const trackDetails = [trackOneDetails]
  const genre = 'Electronic - Progressive House'
  const mood = 'Tender'
  const tags = ['TAG1', 'TAG2']

  await page.goto('upload')
  await waitForUser(page)

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3')
  await selectPage.setReleaseType('Playlist')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your playlist/i })
  ).toBeVisible()

  const editPage = new EditPlaylistPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(playlistName)
  await editPage.setGenre(genre)
  await editPage.setMood(mood)
  await editPage.setTags(tags)
  await editPage.setDescription(playlistDescription)

  for (let i = 0; i < trackDetails.length; i++) {
    await editPage.setTrackDetails(i, trackDetails[i])
  }

  await editPage.complete()

  const finishPage = new UploadFinishPage(page, 'Playlist')
  await finishPage.assertCompletes()

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
  const trackOne = trackTable.getByRole('cell', { name: trackOneDetails.name })
  // const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible({ timeout: 20000 }) // sometimes loading the track list can take longer
  // await expect(trackTwo).toBeVisible()

  // Visit track 1
  await trackOne.getByRole('link', { name: trackOneDetails.name }).click()

  // Assert tagged
  const tag1 = page.getByRole('link', { name: tags[0] })
  const tag2 = page.getByRole('link', { name: tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // Assert genre and mood
  await expect(page.getByText(genre)).toBeVisible()
  await expect(page.getByText(mood)).toBeVisible()

  // await page.goBack()

  // Visit track 2
  // await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()

  // await expect(tag1).toBeVisible()
  // await expect(tag2).toBeVisible()

  // TODO: custom track details was intentionally regressed, these checks can be re-enabled whenever the feature is refactored
  // Assert tagged differently
  // const tag3 = page.getByRole('link', { name: trackTwoDetails.tags[0] })
  // const tag4 = page.getByRole('link', { name: trackTwoDetails.tags[1] })

  // TODO: custom track details was intentionally regressed, these checks can be re-enabled whenever the feature is refactored
  // // Assert different genre and mood
  // await expect(page.getByText(trackTwoDetails.genre)).toBeVisible()
  // await expect(page.getByText(trackTwoDetails.mood)).toBeVisible()
})

test('should upload an album', async ({ page }) => {
  const timestamp = Date.now()
  const playlistName = `Test album ${timestamp}`
  const playlistDescription = 'Test description'
  const trackOneDetails = { name: `Test track 1 ${timestamp}` }
  // const trackTwoDetails = {
  //   name: `Test track 2 ${timestamp}`
  // }
  // const trackDetails = [trackOneDetails, trackTwoDetails]
  const trackDetails = [trackOneDetails]
  const genre = 'Electronic - Progressive House'
  const mood = 'Tender'
  const tags = ['TAG1', 'TAG2']

  await page.goto('upload')
  await waitForUser(page)

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3')
  await selectPage.setReleaseType('Album')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your album/i })
  ).toBeVisible()

  const editPage = new UploadEditAlbumPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(playlistName)
  await editPage.setGenre(genre)
  await editPage.setMood(mood)
  await editPage.setTags(tags)
  await editPage.setDescription(playlistDescription)
  // Enable downloadable
  await editPage.toggleDownloadable()

  for (let i = 0; i < trackDetails.length; i++) {
    await editPage.setTrackDetails(i, trackDetails[i])
  }

  await editPage.complete()

  const finishPage = new UploadFinishPage(page, 'Album')
  await finishPage.assertCompletes()

  // Vist collection page
  await page.getByRole('link', { name: /visit album page/i }).click()

  // Assert title
  const header = page.getByRole('heading', { name: playlistName, level: 1 })
  await expect(header).toBeVisible()

  // Assert description
  const description = page.getByText(playlistDescription)
  await expect(description).toBeVisible()

  // Assert track list
  const trackTable = page.getByRole('table')
  const trackOne = trackTable.getByRole('cell', { name: trackOneDetails.name })
  // const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible()
  // await expect(trackTwo).toBeVisible()

  // Visit track 1
  await trackOne.getByRole('link', { name: trackOneDetails.name }).click()

  // Assert tagged
  const tag1 = page.getByRole('link', { name: tags[0] })
  const tag2 = page.getByRole('link', { name: tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // Assert downloadable
  const downloadText = page.getByText(/Stems & downloads/i)
  await expect(downloadText).toBeVisible()

  // Assert genre and mood
  await expect(page.getByText(genre)).toBeVisible()
  await expect(page.getByText(mood)).toBeVisible()

  // await page.goBack()

  // Visit track 2
  // await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()

  // Assert downloadable text
  // await expect(downloadText).toBeVisible()

  // Assert tagged differently
  // const tag3 = page.getByRole('link', { name: trackTwoDetails.tags[0] })
  // const tag4 = page.getByRole('link', { name: trackTwoDetails.tags[1] })
  // await expect(tag1).toBeVisible()
  // await expect(tag2).toBeVisible()

  // // Assert different genre and mood
  // await expect(page.getByText(trackTwoDetails.genre)).toBeVisible()
  // await expect(page.getByText(trackTwoDetails.mood)).toBeVisible()
})

test('should upload a premium album', async ({ browser, page }) => {
  const timestamp = Date.now()
  const albumName = `Test album ${timestamp}`
  const albumDescription = 'Test description'
  const trackOneDetails = { name: `Test track 1 ${timestamp}` }
  const trackTwoDetails = {
    name: `Test track 2 ${timestamp}`
  }
  const trackDetails = [trackOneDetails, trackTwoDetails]
  const genre = 'Electronic - Progressive House'
  const mood = 'Tender'
  const tags = ['TAG1', 'TAG2']
  const albumPrice = 5
  const albumTrackPrice = 2

  await page.goto('upload')
  await waitForUser(page)

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3', 'track-2.mp3')
  await selectPage.setReleaseType('Album')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your album/i })
  ).toBeVisible()

  const editPage = new UploadEditAlbumPage(page)
  await editPage.setArtwork('track-artwork.jpeg')
  await editPage.setTitle(albumName)
  await editPage.setGenre(genre)
  await editPage.setMood(mood)
  await editPage.setTags(tags)
  await editPage.setDescription(albumDescription)
  await editPage.setAlbumAccessType('premium', {
    albumPrice,
    albumTrackPrice
  })

  for (let i = 0; i < trackDetails.length; i++) {
    await editPage.setTrackDetails(i, trackDetails[i])
  }

  await editPage.complete()

  const finishPage = new UploadFinishPage(page, 'Album')
  await finishPage.assertCompletes()

  // Vist album page
  await page.getByRole('link', { name: /visit album page/i }).click()
  const albumUrl = page.url()

  // Assert title
  const header = page.getByRole('heading', { name: albumName, level: 1 })
  await expect(header).toBeVisible()

  // Assert description
  const description = page.getByText(albumDescription)
  await expect(description).toBeVisible()

  // Assert price (& shows as expected to the uploader)
  const albumPriceText = page.getByText(`$${albumPrice}.00`)
  await expect(albumPriceText).toBeVisible()
  const albumOwnerText = page.getByText(
    /Users can unlock access to this album/i
  )
  await expect(albumOwnerText).toBeVisible()

  // Assert track list
  const trackTable = page.getByRole('table')
  const trackOne = trackTable.getByRole('cell', { name: trackOneDetails.name })
  // const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible({ timeout: 20000 }) // sometimes loading the track list can take longer
  // await expect(trackTwo).toBeVisible()

  // Visit track 1
  await trackOne.getByRole('link', { name: trackOneDetails.name }).click()
  const track1url = await page.url()

  // Assert premium track price
  const trackPriceText = page.getByText(`$${albumTrackPrice}.00`)
  await expect(trackPriceText).toBeVisible()
  const trackOwnerText = page.getByText(
    /Users can unlock access to this track/i
  )
  await expect(trackOwnerText).toBeVisible()

  // Assert tagged
  const tag1 = page.getByRole('link', { name: tags[0] })
  const tag2 = page.getByRole('link', { name: tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // Assert genre and mood
  await expect(page.getByText(genre)).toBeVisible()
  await expect(page.getByText(mood)).toBeVisible()

  await page.goBack()

  // Visit track 2
  // await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()
  // const track2url = await page.url()

  // Assert tags
  // await expect(tag1).toBeVisible()
  // await expect(tag2).toBeVisible()

  // // Assert genre and mood
  // await expect(page.getByText(genre)).toBeVisible()
  // await expect(page.getByText(mood)).toBeVisible()

  // // Assert premium track price
  // await expect(trackPriceText).toBeVisible()
  // await expect(trackOwnerText).toBeVisible()

  // Open the tracks in a new browser to ensure the premium pages looks as expected to non-owners
  const newPage = await openCleanBrowser({ browser })
  const buyButton = newPage.getByRole('button', { name: /buy/i })
  const newPageAlbumPriceText = newPage.getByText(`$${albumPrice}.00`)
  const newPageTrackPriceText = newPage.getByText(`$${albumTrackPrice}.00`)

  newPage.goto(albumUrl)
  await expect(buyButton).toBeVisible({ timeout: 20000 }) // The first track page load can take extra long sometimes (mainly in CI)
  await expect(newPageAlbumPriceText).toBeVisible()

  newPage.goto(track1url)
  await expect(buyButton).toBeVisible()
  await expect(newPageTrackPriceText).toBeVisible()
  // newPage.goto(track2url)
  // await expect(buyButton).toBeVisible()
  // await expect(newPageTrackPriceText).toBeVisible()
})
