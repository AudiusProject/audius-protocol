import { readFileSync } from 'fs'

import { Browser, Locator, Page } from '@playwright/test'
import dayjs from 'dayjs'

export function generateTestUser() {
  const ts = dayjs().format('YYMMDD_HHmmss')
  const email = `e2etest+${ts}@audius.co`
  const password = 'Pa$$w0rdTest'
  const name = `e2e test ${ts}`
  const handle = `e2e_test_${ts}`
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
  fileType: string // TODO: is there a standard mime TS type to go here?
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

export const openCleanBrowser = async ({ browser }: { browser: Browser }) => {
  const type = browser.browserType()
  const newBrowser = await type.launch()

  const newPage = await newBrowser.newPage()
  const context = await newPage.context()
  // Clear out auth state
  context.addInitScript(() => {
    window.localStorage.clear()
  })
  return newPage
}

export const waitForConfirmation = async (page: Page) => {
  return page.waitForResponse(
    async (response) => {
      if (response.url().includes('block_confirmation')) {
        const json = await response.json()
        return json.data.block_passed
      }
    },
    { timeout: 60 * 1000 }
  )
}
