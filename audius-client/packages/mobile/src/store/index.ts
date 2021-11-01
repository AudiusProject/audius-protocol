import { CommonState } from 'audius-client/src/common/store'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension'

import googleCast, { GoogleCastState } from './googleCast/reducer'
import audio, { AudioState } from './audio/reducer'
import oauth, { OAuthState } from './oauth/reducer'
import web, { WebState } from './web/reducer'
import lifecycle, { LifecycleState } from './lifecycle/reducer'
import notifications, { NotificationsState } from './notifications/reducer'
import search, { SearchState } from './search/reducer'
import signon, { SignonState } from './signon/reducer'
import theme, { ThemeState } from './theme/reducer'
import drawers, { DrawersState } from './drawers/slice'
import clientStore from './clientStore/slice'

import rootSaga from './sagas'
import { KeyboardState } from './keyboard/slice'

export type AppState = {
  audio: AudioState
  clientStore: CommonState
  drawers: DrawersState
  googleCast: GoogleCastState
  keyboard: KeyboardState
  lifecycle: LifecycleState
  notifications: NotificationsState
  oauth: OAuthState
  search: SearchState
  signon: SignonState
  theme: ThemeState
  web: WebState
}

const createRootReducer = () =>
  combineReducers({
    audio,
    clientStore,
    drawers,
    googleCast,
    lifecycle,
    notifications,
    oauth,
    search,
    signon,
    theme,
    web
  })

export default () => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = applyMiddleware(sagaMiddleware)
  const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
  const store = createStore(createRootReducer(), composeEnhancers(middlewares))
  sagaMiddleware.run(rootSaga)
  return store
}
