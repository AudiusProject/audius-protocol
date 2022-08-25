import type { RemoteConfigState, CommonState } from '@audius/common'
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

import type { AudioState } from './audio/reducer'
import audio from './audio/reducer'
import { reducer as common } from './common/reducer'
import type { DownloadState } from './download/slice'
import downloads from './download/slice'
import type { DrawersState } from './drawers/slice'
import drawers from './drawers/slice'
import type { KeyboardState } from './keyboard/slice'
import keyboard from './keyboard/slice'
import type { LifecycleState } from './lifecycle/reducer'
import lifecycle from './lifecycle/reducer'
import type { NotificationsState } from './notifications/reducer'
import notifications from './notifications/reducer'
import type { OAuthState } from './oauth/reducer'
import oauth from './oauth/reducer'
import rootSaga from './sagas'
import type { SearchState } from './search/reducer'
import search from './search/reducer'
import type { SignonState } from './signon/reducer'
import signon from './signon/reducer'
import { storeContext } from './storeContext'
import type { WebState } from './web/reducer'
import web from './web/reducer'

export type AppState = {
  // These also belong in CommonState but are here until we move them to the @audius/common package:
  signOn: ReturnType<typeof signOnReducer>
  backend: BackendState
  confirmer: ConfirmerState
  searchBar: SearchBarState

  audio: AudioState
  common: CommonState
  drawers: DrawersState
  downloads: DownloadState
  keyboard: KeyboardState
  lifecycle: LifecycleState
  notifications: NotificationsState
  oauth: OAuthState
  remoteConfig: RemoteConfigState
  search: SearchState
  signOnLegacy: SignonState
  web: WebState
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

    audio,
    common,
    drawers,
    downloads,
    keyboard,
    lifecycle,
    notifications,
    oauth,
    remoteConfig,
    search,
    // Sign on store that is part of the mobile client
    // Should be entirely removed in favor of the shared common
    // sign on store
    signOnLegacy: signon,
    web
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
