import React from 'react'

import { ConnectedRouter } from 'connected-react-router'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import configureStore from 'store/configureStore'
import history from 'utils/history'

import App from './App'

jest.mock('jimp/es', () => null)
jest.mock('./visualizer/Visualizer', () => () => null)
jest.mock('react-spring/renderprops', () => ({
  Spring: () => null,
  Transition: () => null
}))
// Mock the backend setup.
jest.mock('store/backend/sagas', () => ({
  __esModule: true,
  default: () => [],
  setupBackend: function* () {},
  waitForBackendSetup: () => true
}))
// Mock the solana collectibles client
jest.mock('services/solana-client/SolanaClient', () => ({
  SolanaClient: () => {}
}))

describe('smoke test', () => {
  let store
  beforeAll(() => {
    store = configureStore()
  })

  it('renders without crashing', () => {
    const rootNode = document.createElement('div')
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>,
      rootNode
    )
  })
})
