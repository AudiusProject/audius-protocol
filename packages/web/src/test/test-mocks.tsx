import { vi } from 'vitest'

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

vi.mock('connected-react-router', async (importOriginal) => {
  const originalImport: any = await importOriginal()
  return { ...originalImport, connectRouter: vi.fn() }
})

window.matchMedia = vi.fn().mockReturnValue({
  matches: [],
  addListener: vi.fn(),
  removeListener: vi.fn()
})
