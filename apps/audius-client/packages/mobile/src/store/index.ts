import { combineReducers } from 'redux'

import googleCast, { GoogleCastState } from './googleCast/reducer'
import audio, { AudioState } from './audio/reducer'
import oauth, { OAuthState } from './oauth/reducer'
import web, { WebState } from './web/reducer'
import lifecycle, { LifecycleState } from './lifecycle/reducer'
import notifications, { NotificationsState } from './notifications/reducer'
import theme, { ThemeState } from './theme/reducer'

export type AppState = {
  audio: AudioState
  web: WebState
  oauth: OAuthState
  lifecycle: LifecycleState
  googleCast: GoogleCastState
  notifications: NotificationsState
  theme: ThemeState
}

const createRootReducer = () =>
  combineReducers({
    audio,
    web,
    oauth,
    lifecycle,
    googleCast,
    notifications,
    theme
  })

export default createRootReducer
