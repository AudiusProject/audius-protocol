import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import {
  describe,
  expect,
  it,
  beforeAll,
  afterEach,
  afterAll,
  vi,
  beforeEach
} from 'vitest'

import { mockArtistCoin } from 'test/mocks/fixtures/artistCoin'
import { artistCoinMswMocks } from 'test/msw/mswMocks'
import { RenderOptions, mswServer, render, screen } from 'test/test-utils'

import { AssetDetailPage } from './AssetDetailPage'

export function renderAssetDetailPage(coin: any, options?: RenderOptions) {
  mswServer.use(...artistCoinMswMocks(coin))

  return render(
    <Routes>
      <Route
        path='/'
        element={<Navigate to={`/coin/${coin.mint}`} replace />}
      />
      <Route path='/coin/:mint' element={<AssetDetailPage />} />
    </Routes>,
    options
  )
}

describe('AssetDetailPage', () => {
  beforeEach(() => {
    // Mock any DOM methods if needed
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeAll(() => {
    mswServer.listen()
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  it('renders ticker', async () => {
    renderAssetDetailPage(mockArtistCoin)

    // Check that the ticker is rendered in the header
    expect(
      await screen.findByRole('heading', { name: mockArtistCoin.ticker })
    ).toBeInTheDocument()
  })
})
