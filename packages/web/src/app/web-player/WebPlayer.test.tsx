import { ConnectedRouter } from 'connected-react-router'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { describe, it, vitest } from 'vitest'

import { configureStore } from 'store/configureStore'
import { createHistory } from 'utils/history'

import WebPlayer from './WebPlayer'

vitest.mock('jimp/es', () => null)
vitest.mock('./visualizer/Visualizer', () => () => null)
vitest.mock('react-spring/renderprops.cjs', () => ({
  Spring: () => null,
  Transition: () => null
}))
// Mock the backend setup.
vitest.mock('store/backend/sagas', () => ({
  __esModule: true,
  default: () => [],
  setupBackend: function* () {},
  waitForBackendSetup: () => true
}))
// Mock the solana collectibles client
vitest.mock('services/solana-client/SolanaClient', () => ({
  SolanaClient: () => {}
}))

describe('smoke test', () => {
  it('renders without crashing', () => {
    const history = createHistory()
    const rootNode = document.createElement('div')
    const store = configureStore(history, false, {}, false)
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <WebPlayer />
        </ConnectedRouter>
      </Provider>,
      rootNode
    )
  })
})
