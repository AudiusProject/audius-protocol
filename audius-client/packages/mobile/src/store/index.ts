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
import clientStore from './clientStore/slice'

import rootSaga from './sagas'
import { KeyboardState } from './keyboard/slice'

export type AppState = {
  audio: AudioState
  web: WebState
  oauth: OAuthState
  lifecycle: LifecycleState
  googleCast: GoogleCastState
  notifications: NotificationsState
  theme: ThemeState
  search: SearchState
  clientStore: any
  keyboard: KeyboardState
  signon: SignonState
}

const createRootReducer = () =>
  combineReducers({
    clientStore,
    audio,
    web,
    oauth,
    lifecycle,
    googleCast,
    notifications,
    theme,
    search,
    signon
  })

export default () => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = applyMiddleware(sagaMiddleware)
  const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 })
  const store = createStore(createRootReducer(), composeEnhancers(middlewares))
  sagaMiddleware.run(rootSaga)
  return store
}
