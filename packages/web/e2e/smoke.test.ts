import { expect } from '@playwright/test'
import { test } from './test'
import { getAlbum, getPlaylist, getRemix, getRemixes, getTrack } from './data'

test('should load an album page', async ({ page }) => {
  const { url, name } = getAlbum()
  await page.goto(url)
  const heading = page.getByRole('heading', {
    name,
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
  const { url, name } = getPlaylist()
  await page.goto(url)
  const heading = page.getByRole('heading', {
    name
  })
  await expect(heading).toBeVisible()
})

test('should load a remix page', async ({ page }) => {
  const { url, name } = getRemix()
  await page.goto(url)
  const heading = page.getByRole('heading', {
    name,
    level: 1
  })
  await expect(heading).toBeVisible()
})

test('should load a remixes page', async ({ page }) => {
  const { url } = getRemixes()
  await page.goto(url)

  const heading = page.getByRole('heading', { name: 'Remixes', level: 1 })
  await expect(heading).toBeVisible()
})

test('should load a track page', async ({ page }) => {
  const { url, name } = getTrack()
  await page.goto(url)
  const heading = page.getByRole('heading', {
    name,
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
