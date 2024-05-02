import { expect } from '@playwright/test'
import { test } from './test'
import { readFileSync } from 'fs'

test('should load an album page', async ({ page }) => {
  await page.goto('df/album/probers_album_do_not_delete-512')
  const heading = page.getByRole('heading', {
    name: 'probers_album_do_not_delete',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load the feed page', async ({ page }) => {
  await page.goto('feed')
  const heading = page.getByRole('heading', { name: 'Your Feed', level: 1 })
  await expect(heading).toBeVisible()
})

test('should load a playlist page', async ({ page }) => {
  await page.goto('df/playlist/probers_playlist_do_not_delete-511')
  const heading = page.getByRole('heading', {
    name: 'PROBERS_PLAYLIST_DO_NOT_DELETE'
  })
  await expect(heading).toBeVisible()
})

test('should load a remix page', async ({ page }) => {
  await page.goto('df/probers_remix_do_not_delete-2859')
  const heading = page.getByRole('heading', {
    name: 'probers_remix_do_not_delete'
  })
  await expect(heading).toBeVisible()
})

test('should load a remixes page', async ({ page }) => {
  await page.goto('mb430/traektoria-source-2217/remixes')
  const heading = page.getByRole('heading', { name: 'Remixes', level: 1 })
  await expect(heading).toBeVisible()
})

test('should load a track page', async ({ page }) => {
  const user = JSON.parse(readFileSync('./e2e/user.json', 'utf8'))
  const track = JSON.parse(readFileSync('./e2e/track.json', 'utf8'))

  await page.goto(`${user.handle}/${track.title.replace(/ /g, '-')}`)
  const heading = page.getByRole('heading', {
    name: 'title',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load trending page', async ({ page }) => {
  await page.goto('trending')
  const heading = page.getByRole('heading', {
    name: 'Trending',
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load upload page', async ({ page }) => {
  await page.goto(`upload`)
  const heading = page.getByRole('heading', {
    name: 'Upload Your Music',
    level: 1
  })
  await expect(heading).toBeVisible()
})
