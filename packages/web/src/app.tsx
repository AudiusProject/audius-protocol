import React from 'react'

import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'

import configureStore from './store/configureStore'
import history from './utils/history'
import logger from 'utils/logger'
import AppContext from 'AppContext'
import App from './containers/App'
import './services/webVitals'
import './index.css'

declare global {
  interface Window {
    store: any
  }
}

const store = configureStore()
window.store = store
logger(store)

type AudiusAppProps = {
  setReady: () => void
  isReady: boolean
  setConnectivityFailure: (failure: boolean) => void
  shouldShowPopover: boolean
}

const AudiusApp = ({
  setReady,
  isReady,
  setConnectivityFailure,
  shouldShowPopover
}: AudiusAppProps) => {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <AppContext>
          <App
            // TS has some issue with withRouter when
            // interacting between TS + JS components.
            // This goes away when we port `App` to TS
            // @ts-ignore
            setReady={setReady}
            isReady={isReady}
            setConnectivityFailure={setConnectivityFailure}
            shouldShowPopover={shouldShowPopover}
          />
        </AppContext>
      </ConnectedRouter>
    </Provider>
  )
}

export default AudiusApp
