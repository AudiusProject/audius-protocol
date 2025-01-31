import { expect } from '@playwright/test'

import { getAlbum } from './data'
import { EditAlbumPage } from './page-object-models/editCollection'
import { CollectionPriceAndAudienceModal } from './page-object-models/modals'
import { test } from './test'
import { waitForConfirmation } from './utils'

test('should persist collection edits', async ({ page }) => {
  const { permalink } = getAlbum()

  const newTitle = 'EDITED TITLE'
  const newDescription = 'EDITED DESCRIPTION'
  const newPrice = '$1.23'

  await page.goto(permalink)
  await page.getByRole('link', { name: /edit album/i }).click()
  const editAlbumPage = new EditAlbumPage(page)

  await editAlbumPage.setArtwork('track-artwork.jpeg')
  await editAlbumPage.setTitle(newTitle)
  await editAlbumPage.setDescription(newDescription)

  await editAlbumPage.openPriceAndAudienceModal()
  const priceAndAudienceModal = new CollectionPriceAndAudienceModal(page)
  await priceAndAudienceModal.setPremium({ price: newPrice })
  await priceAndAudienceModal.save()

  // Assert that we warned the user about changing the audience
  await expect(page.getByText(/confirm update/i)).toBeVisible()
  await page.getByRole('button', { name: /update audience/i }).click()

  await editAlbumPage.save()

  // Assert title changed
  await expect(
    page.getByRole('heading', { name: newTitle, level: 1 })
  ).toBeVisible({ timeout: 20 * 1000 })

  // Assert description changed
  await expect(page.getByText(newDescription)).toBeVisible()

  // Assert gated
  await expect(page.getByText(/premium album/i)).toBeVisible()

  // Assert price change
  await expect(page.getByText(newPrice)).toBeVisible()

  // Check it all persists upon reload
  await waitForConfirmation(page)
  await page.reload()

  // Assert title changed
  await expect(
    page.getByRole('heading', { name: newTitle, level: 1 })
  ).toBeVisible()

  // Assert description changed
  await expect(page.getByText(newDescription)).toBeVisible()

  // Assert gated
  await expect(page.getByText(/premium album/i)).toBeVisible()

  // Assert price change
  await expect(page.getByText(newPrice)).toBeVisible()
})
