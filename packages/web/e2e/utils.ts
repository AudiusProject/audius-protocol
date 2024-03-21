import { Page, expect } from '@playwright/test'
import dayjs from 'dayjs'

type AppPath = 'signup' | 'trending' | 'signin' | '' // blank is the marketing site

export const goToPage = async ({
  page,
  path
}: {
  page: Page
  path: AppPath
}) => {
  await page.goto(path)
  switch (path) {
    case '':
      await expect(
        page.getByRole('heading', { name: /artists deserve more/i, level: 1 })
      ).toBeVisible({ timeout: 25000 })
      break

    case 'signup':
      // Optional debug step
      await expect(
        page.getByRole('heading', { name: /sign up for audius/i, level: 1 })
      ).toBeVisible({ timeout: 25000 })
      break

    case 'signin':
      await expect(
        page.getByRole('heading', { name: /sign into audius/i })
      ).toBeVisible({ timeout: 25000 })
      break
    case 'trending':
      await expect(
        page.getByRole('heading', { name: /trending/i, level: 1 })
      ).toBeVisible({ timeout: 25000 })
      break
    default:
      break
  }
}

export function generateTestUser() {
  const ts = dayjs().format('YYMMDD_HHmmss')
  const email = `prober+${ts}@audius.co`
  const password = 'Pa$$w0rdTest'
  const name = `Prober ${ts}`
  const handle = `p_${ts}`
  return {
    email,
    password,
    name,
    handle
  }
}
