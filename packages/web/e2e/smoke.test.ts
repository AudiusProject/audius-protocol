import { test, expect } from '@playwright/test'
import { navigate } from './helpers'

test('should load an album page', async ({ page }) => {
  await navigate(page, 'df/album/probers_album_do_not_delete-512')
  const heading = page.getByRole('heading', {
    name: 'probers_album_do_not_delete',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load the feed page', async ({ page }) => {
  await navigate(page, 'feed')
  const heading = page.getByRole('heading', { name: 'Your Feed', level: 1 })
  await expect(heading).toBeVisible()
})

test('should load a playlist page', async ({ page }) => {
  await navigate(page, 'df/playlist/probers_playlist_do_not_delete-511')
  const heading = page.getByRole('heading', {
    name: 'PROBERS_PLAYLIST_DO_NOT_DELETE'
  })
  await expect(heading).toBeVisible()
})

test('should load a remix page', async ({ page }) => {
  await navigate(page, 'df/probers_remix_do_not_delete-2859')
  const heading = page.getByRole('heading', {
    name: 'probers_remix_do_not_delete'
  })
  await expect(heading).toBeVisible()
})

test('should load a remixes page', async ({ page }) => {
  await navigate(page, 'mb430/traektoria-source-2217/remixes')
  const heading = page.getByRole('heading', { name: 'Remixes', level: 1 })
  await expect(heading).toBeVisible()
})

test('should load a track page', async ({ page }) => {
  await navigate(page, 'sebastian12/bachgavotte-1')
  const heading = page.getByRole('heading', {
    name: 'probers_track_do_not_delete',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load trending page', async ({ page }) => {
  await navigate(page, 'trending')
  const heading = page.getByRole('heading', {
    name: 'Trending',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load upload page', async ({ page }) => {
  await navigate(page, `upload`)
  const heading = page.getByRole('heading', {
    name: 'Upload Your Music',
    level: 1
  })
  await expect(heading).toBeVisible()
})
