import { combineReducers } from 'redux'

import googleCast, { GoogleCastState } from './googleCast/reducer'
import audio, { AudioState } from './audio/reducer'
import oauth, { OAuthState } from './oauth/reducer'
import web, { WebState } from './web/reducer'
import lifecycle, { LifecycleState } from './lifecycle/reducer'

export type AppState = {
  audio: AudioState,
  web: WebState,
  oauth: OAuthState,
  lifecycle: LifecycleState,
  googleCast: GoogleCastState
}

const createRootReducer = () => combineReducers({
  audio,
  web,
  oauth,
  lifecycle,
  googleCast
})

export default createRootReducer
