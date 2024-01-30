import type { CommonState, RemoteConfigState } from '@audius/common'
import {
  toastActions,
  remoteConfigReducer as remoteConfig,
  reducers as commonReducers,
  chatMiddleware
} from '@audius/common'
import { ErrorLevel } from '@audius/common/models'
import AsyncStorage from '@react-native-async-storage/async-storage'
import backend from 'audius-client/src/common/store/backend/reducer'
import type { BackendState } from 'audius-client/src/common/store/backend/types'
import searchBar from 'audius-client/src/common/store/search-bar/reducer'
import type { SearchBarState } from 'audius-client/src/common/store/search-bar/types'
import signOnReducer from 'common/store/pages/signon/reducer'
import type {
  SignOnPageState,
  SignOnPageReducer
} from 'common/store/pages/signon/types'
import RNRestart from 'react-native-restart'
import type { Store } from 'redux'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'

import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { reportToSentry } from 'app/utils/reportToSentry'

import type { DownloadState } from './download/slice'
import downloads from './download/slice'
import type { DrawersState } from './drawers/slice'
import drawers from './drawers/slice'
import type { KeyboardState } from './keyboard/slice'
import keyboard from './keyboard/slice'
import type { OAuthState } from './oauth/reducer'
import oauth from './oauth/reducer'
import type { OfflineDownloadsState } from './offline-downloads/slice'
import offlineDownloads from './offline-downloads/slice'
import type { PurchaseVendorState } from './purchase-vendor/slice'
import purchaseVendor from './purchase-vendor/slice'
import rootSaga from './sagas'
import type { SearchState } from './search/searchSlice'
import search from './search/searchSlice'
import shareToStoryProgress from './share-to-story-progress/slice'
import type { ShareToStoryProgressState } from './share-to-story-progress/slice'
import { storeContext } from './storeContext'
import type { WalletConnectState } from './wallet-connect/slice'
import walletConnect from './wallet-connect/slice'

const errorRestartTimeout = 2000

const { toast } = toastActions

export type AppState = CommonState & {
  // These also belong in CommonState but are here until we move them to the @audius/common package:
  signOn: SignOnPageState
  backend: BackendState
  searchBar: SearchBarState

  drawers: DrawersState
  downloads: DownloadState
  keyboard: KeyboardState
  oauth: OAuthState
  offlineDownloads: OfflineDownloadsState
  remoteConfig: RemoteConfigState
  search: SearchState
  walletConnect: WalletConnectState
  shareToStoryProgress: ShareToStoryProgressState
  purchaseVendor: PurchaseVendorState
}

const messages = {
  error: 'Something went wrong'
}

const initializationTime = Date.now()

const onSagaError = (
  error: Error,
  errorInfo: {
    sagaStack: string
  }
) => {
  console.error(
    `Caught saga error: ${error} ${JSON.stringify(errorInfo, null, 4)}`
  )

  dispatch(
    toast({
      content: messages.error,
      type: 'error',
      timeout: errorRestartTimeout
    })
  )

  reportToSentry({
    level: ErrorLevel.Fatal,
    error,
    additionalInfo: errorInfo
  })

  // Automatically restart the app if the session is longer
  // than 30 seconds. Don't want to restart for shorter sessions
  // because it could result in a restart loop
  if (Date.now() - initializationTime > 30000) {
    setTimeout(() => {
      RNRestart.Restart()
    }, errorRestartTimeout)
  }
}

const commonStoreReducers = commonReducers(AsyncStorage)

const rootReducer = combineReducers({
  ...commonStoreReducers,
  // These also belong in common store reducers but are here until we move them to the @audius/common package:
  backend,
  signOn: signOnReducer as SignOnPageReducer,
  searchBar,

  drawers,
  downloads,
  keyboard,
  oauth,
  offlineDownloads,
  remoteConfig,
  search,
  walletConnect,
  shareToStoryProgress,
  purchaseVendor
})

const sagaMiddleware = createSagaMiddleware({
  context: storeContext,
  onError: onSagaError
})

const middlewares = [sagaMiddleware, chatMiddleware(audiusSdk), thunk]

export const store = createStore(
  rootReducer,
  applyMiddleware(...middlewares)
) as unknown as Store<AppState> // need to explicitly type the store for offline-mode store reference

export const persistor = persistStore(store)

sagaMiddleware.run(rootSaga)

const { dispatch } = store
export { dispatch }
