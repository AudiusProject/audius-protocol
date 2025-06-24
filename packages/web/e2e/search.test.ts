import { expect } from '@playwright/test'

import { test } from './test'
import { resetAuthState } from './utils'

test.describe('Search', () => {
  // Resets auth state for this suite so we aren't already signed in
  test.use(resetAuthState)

  test('should show search results', async ({ page }) => {
    // Navigate to explore page (which uses NewExplorePage)
    await page.goto('explore')

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible()

    // Find the search input and type a search query
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await searchInput.fill('test')

    // Wait for search results to appear
    await expect(page.getByText(/profiles/i)).toBeVisible({ timeout: 10000 })
  })
})
