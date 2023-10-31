import { createRef, MutableRefObject } from 'react'

import { ConnectedRouter } from 'connected-react-router'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { describe, it, vitest } from 'vitest'

import { store } from 'store/configureStore'
import history from 'utils/history'

import App from './App'

vitest.mock('jimp/es', () => null)
vitest.mock('./visualizer/Visualizer', () => () => null)
vitest.mock('react-spring/renderprops', () => ({
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
    const rootNode = document.createElement('div')
    const mainContentRef =
      createRef<HTMLDivElement | null>() as MutableRefObject<
        HTMLDivElement | undefined
      >
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App mainContentRef={mainContentRef} />
        </ConnectedRouter>
      </Provider>,
      rootNode
    )
  })
})
