import '@testing-library/jest-dom/vitest'
import './vitest-canvas-mock'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Some global mocks that most tests will need.
// If you need to provide any form of mocked responses, you can replace them in your test with a hoisted implementation
// @ts-ignore
Element.prototype.scrollTo = vi.fn()
document.addEventListener = vi.fn()
document.removeEventListener = vi.fn()

vi.mock('@audius/sdk', async (importOriginal) => {
  const originalImport: any = await importOriginal()
  return {
    ...originalImport,
    ClaimableTokensClient: vi.fn(),
    RewardManagerClient: vi.fn(),
    full: Object.entries(originalImport.full).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: vi.fn() }),
      {}
    )
  }
})

vi.mock('redux-first-history', async (importOriginal) => {
  const originalImport: any = await importOriginal()
  return { ...originalImport, connectRouter: vi.fn() }
})

window.matchMedia = vi.fn().mockReturnValue({
  matches: [],
  addListener: vi.fn(),
  removeListener: vi.fn()
})

afterEach(cleanup)
