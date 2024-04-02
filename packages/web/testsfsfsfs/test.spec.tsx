import React from 'react'

import { test, expect } from '@playwright/experimental-ct-react'

test('event should work', async ({ mount }) => {
  const clicked = false

  // Mount a component. Returns locator pointing to the component.
  const component = await mount(<div></div>)

  // As with any Playwright test, assert locator text.
  await expect(component).toContainText('Submit')

  // Perform locator click. This will trigger the event.
  await component.click()

  // Assert that respective events have been fired.
  expect(clicked).toBeTruthy()
})
