import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import { createMemoryHistory } from 'history'
import { Switch, Route } from 'react-router-dom'
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

import { mockArtistCoin } from 'test/mocks/fixtures/artistCoins'
import { mockCoinByMint } from 'test/msw/mswMocks'
import { RenderOptions, mswServer, render, screen } from 'test/test-utils'

import { AssetDetailPage } from './AssetDetailPage'

export function renderAssetDetailPage(coin: any, options?: RenderOptions) {
  mswServer.use(mockCoinByMint(coin))

  const history = createMemoryHistory({
    initialEntries: [`/wallet/${coin.mint}`]
  })

  return render(
    <Switch>
      <Route
        path={ASSET_DETAIL_PAGE}
        // @ts-expect-error
        render={(props) => <AssetDetailPage {...props} />}
      />
    </Switch>,
    {
      ...options,
      customHistory: history
    }
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

    // TODO: check more things
  })
  /**
   * TODO: write more tests
   */
})
