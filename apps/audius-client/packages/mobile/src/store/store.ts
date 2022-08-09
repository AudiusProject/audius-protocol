import type { CommonState } from 'audius-client/src/common/store'
import type { RemoteConfigState } from 'audius-client/src/common/store/remote-config/slice'
import remoteConfig from 'audius-client/src/common/store/remote-config/slice'
import { reducers as commonReducers } from 'common/store/reducers'
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
  signon: SignonState
  web: WebState
}

const createRootReducer = () =>
  combineReducers({
    ...commonReducers(),
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
    signon,
    web
  })

const sagaMiddleware = createSagaMiddleware({ context: storeContext })
const middlewares = applyMiddleware(sagaMiddleware)
const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
export const store = createStore(
  createRootReducer(),
  composeEnhancers(middlewares)
)
sagaMiddleware.run(rootSaga)

const { dispatch } = store
export { dispatch }
