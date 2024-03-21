import { test, expect } from '@playwright/test'

test('renders', async ({ page }) => {
  await page.goto('localhost:4173')

  await expect(
    page.getByRole('heading', { name: 'React + @audius/sdk' })
  ).toBeVisible()
})

test('fetches and renders tracks', async ({ page }) => {
  await page.goto('localhost:4173')

  await page.getByRole('button', { name: 'Get Tracks' }).click()

  await expect(
    page.getByRole('button', { name: 'Favorite' }).first()
  ).toBeVisible()
})
