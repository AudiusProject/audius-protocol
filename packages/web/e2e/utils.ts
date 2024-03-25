import { readFileSync } from 'fs'

import { Locator, Page, expect } from '@playwright/test'
import dayjs from 'dayjs'

type AppPath = 'signup' | 'trending' | 'signin' | '' // blank is the marketing site

const COLD_START_TIMEOUT = 25000 // Added timeout buffer for cold starts

export const goToPage = async ({
  page,
  path
}: {
  page: Page
  path: AppPath
}) => {
  await page.goto(path, { waitUntil: 'load' })
  switch (path) {
    case '':
      await expect(
        page.getByRole('heading', { name: /artists deserve more/i, level: 1 })
      ).toBeVisible({ timeout: COLD_START_TIMEOUT })
      break

    case 'signup':
      // Optional debug step
      await expect(
        page.getByRole('heading', { name: /sign up for audius/i, level: 1 })
      ).toBeVisible({ timeout: COLD_START_TIMEOUT })
      break

    case 'signin':
      await expect(
        page.getByRole('heading', { name: /sign into audius/i })
      ).toBeVisible({ timeout: COLD_START_TIMEOUT })
      break
    case 'trending':
      await expect(
        page.getByRole('heading', { name: /trending/i, level: 1 })
      ).toBeVisible({ timeout: COLD_START_TIMEOUT })
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

// Simulates dragging and dropping a file onto your target locator
export const dragAndDropFile = async (
  page: Page,
  target: Locator,
  filePath: string,
  fileName: string,
  fileType: string // TODO: is there a standard mime type to go here?
) => {
  const buffer = readFileSync(filePath).toString('base64')

  const dataTransfer = await page.evaluateHandle(
    async ({ bufferData, localFileName, localFileType }) => {
      const dt = new DataTransfer()

      const blobData = await fetch(bufferData).then((res) => res.blob())

      const file = new File([blobData], localFileName, { type: localFileType })
      dt.items.add(file)
      return dt
    },
    {
      bufferData: `data:application/octet-stream;base64,${buffer}`,
      localFileName: fileName,
      localFileType: fileType
    }
  )

  await target.dispatchEvent('drop', { dataTransfer })
}

export const resetAuthState = { storageState: { cookies: [], origins: [] } }
