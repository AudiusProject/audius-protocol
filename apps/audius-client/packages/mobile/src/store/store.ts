import type { RemoteConfigState } from '@audius/common'
import {
  remoteConfigReducer as remoteConfig,
  reducers as commonReducers
} from '@audius/common'
import backend from 'audius-client/src/common/store/backend/reducer'
import type { BackendState } from 'audius-client/src/common/store/backend/types'
import confirmer from 'audius-client/src/common/store/confirmer/reducer'
import type { ConfirmerState } from 'audius-client/src/common/store/confirmer/types'
import signOnReducer from 'audius-client/src/common/store/pages/signon/reducer'
import searchBar from 'audius-client/src/common/store/search-bar/reducer'
import type SearchBarState from 'audius-client/src/common/store/search-bar/types'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import createSagaMiddleware from 'redux-saga'

import type { DownloadState } from './download/slice'
import downloads from './download/slice'
import type { DrawersState } from './drawers/slice'
import drawers from './drawers/slice'
import type { KeyboardState } from './keyboard/slice'
import keyboard from './keyboard/slice'
import mobileUi from './mobileUi/slice'
import type { MobileUiState } from './mobileUi/slice'
import type { OAuthState } from './oauth/reducer'
import oauth from './oauth/reducer'
import rootSaga from './sagas'
import type { SearchState } from './search/reducer'
import search from './search/reducer'
import { storeContext } from './storeContext'

export type AppState = {
  // These also belong in CommonState but are here until we move them to the @audius/common package:
  signOn: ReturnType<typeof signOnReducer>
  backend: BackendState
  confirmer: ConfirmerState
  searchBar: SearchBarState

  drawers: DrawersState
  downloads: DownloadState
  keyboard: KeyboardState
  oauth: OAuthState
  remoteConfig: RemoteConfigState
  search: SearchState
  mobileUi: MobileUiState
}

const commonStoreReducers = commonReducers()

const createRootReducer = () =>
  combineReducers({
    ...commonStoreReducers,
    // These also belong in common store reducers but are here until we move them to the @audius/common package:
    backend,
    confirmer,
    signOn: signOnReducer,
    searchBar,

    drawers,
    downloads,
    keyboard,
    oauth,
    remoteConfig,
    search,
    mobileUi
  })

const sagaMiddleware = createSagaMiddleware({ context: storeContext })
const middlewares = applyMiddleware(sagaMiddleware)
const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 250 })
export const store = createStore(
  createRootReducer(),
  composeEnhancers(middlewares)
)
sagaMiddleware.run(rootSaga)

const { dispatch } = store
export { dispatch }
