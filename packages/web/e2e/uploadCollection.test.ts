import { expect } from '@playwright/test'

import {
  EditAlbumPage,
  EditPlaylistPage,
  UploadFinishPage,
  UploadSelectPage
} from './page-object-models/upload'
import { test } from './test'

test('should upload a playlist', async ({ page }) => {
  const timestamp = Date.now()
  const playlistName = `Test playlist ${timestamp}`
  const playlistDescription = 'Test description'
  const trackOneDetails = { name: `Test track 1 ${timestamp}` }
  const trackTwoDetails = {
    name: `Test track 2 ${timestamp}`
  }
  const trackDetails = [trackOneDetails, trackTwoDetails]
  const genre = 'Electronic - Progressive House'
  const mood = 'Tender'
  const tags = ['TAG1', 'TAG2']

  await page.goto('upload')

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3', 'track-2.mp3')
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
  const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible()
  await expect(trackTwo).toBeVisible()

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

  await page.goBack()

  // Visit track 2
  await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()

  // Assert tagged differently
  // const tag3 = page.getByRole('link', { name: trackTwoDetails.tags[0] })
  // const tag4 = page.getByRole('link', { name: trackTwoDetails.tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // // Assert different genre and mood
  // await expect(page.getByText(trackTwoDetails.genre)).toBeVisible()
  // await expect(page.getByText(trackTwoDetails.mood)).toBeVisible()
})

test('should upload an album', async ({ page }) => {
  const timestamp = Date.now()
  const playlistName = `Test album ${timestamp}`
  const playlistDescription = 'Test description'
  const trackOneDetails = { name: `Test track 1 ${timestamp}` }
  const trackTwoDetails = {
    name: `Test track 2 ${timestamp}`,
    genre: 'Alternative'
  }
  const trackDetails = [trackOneDetails, trackTwoDetails]
  const genre = 'Electronic - Progressive House'
  const mood = 'Tender'
  const tags = ['TAG1', 'TAG2']

  await page.goto('upload')

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3', 'track-2.mp3')
  await selectPage.setReleaseType('Album')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your album/i })
  ).toBeVisible()

  const editPage = new EditAlbumPage(page)
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
  const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible()
  await expect(trackTwo).toBeVisible()

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

  await page.goBack()

  // Visit track 2
  await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()

  // Assert tagged differently
  // const tag3 = page.getByRole('link', { name: trackTwoDetails.tags[0] })
  // const tag4 = page.getByRole('link', { name: trackTwoDetails.tags[1] })
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // // Assert different genre and mood
  // await expect(page.getByText(trackTwoDetails.genre)).toBeVisible()
  // await expect(page.getByText(trackTwoDetails.mood)).toBeVisible()
})

test('should upload a premium album', async ({ page }) => {
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

  const selectPage = new UploadSelectPage(page)
  await selectPage.setTracks('track.mp3', 'track-2.mp3')
  await selectPage.setReleaseType('Album')
  await selectPage.continue()

  await expect(
    page.getByRole('heading', { name: /complete your album/i })
  ).toBeVisible()

  const editPage = new EditAlbumPage(page)
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

  // Assert title
  const header = page.getByRole('heading', { name: albumName, level: 1 })
  await expect(header).toBeVisible()

  // Assert description
  const description = page.getByText(albumDescription)
  await expect(description).toBeVisible()

  // Assert price (& shows as expected to the uploader)
  const albumPriceText = page.getByText(`$${albumPrice}.00`)
  await expect(albumPriceText).toBeVisible()
  const ownerText = page.getByText(/Users can unlock access to this album/i)
  await expect(ownerText).toBeVisible()

  // Assert track list
  const trackTable = page.getByRole('table')
  const trackOne = trackTable.getByRole('cell', { name: trackOneDetails.name })
  const trackTwo = trackTable.getByRole('cell', { name: trackTwoDetails.name })
  await expect(trackOne).toBeVisible()
  await expect(trackTwo).toBeVisible()

  // Visit track 1
  await trackOne.getByRole('link', { name: trackOneDetails.name }).click()

  // Assert premium track price
  const track1Price = page.getByText(`$${albumTrackPrice}.00`)
  await expect(track1Price).toBeVisible()
  await expect(ownerText).toBeVisible()

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
  await trackTwo.getByRole('link', { name: trackTwoDetails.name }).click()

  // Assert tags
  await expect(tag1).toBeVisible()
  await expect(tag2).toBeVisible()

  // Assert genre and mood
  await expect(page.getByText(genre)).toBeVisible()
  await expect(page.getByText(mood)).toBeVisible()

  // Assert premium track price
  const track2Price = page.getByText(`$${albumTrackPrice}.00`)
  await expect(track2Price).toBeVisible()
  await expect(ownerText).toBeVisible()
})
