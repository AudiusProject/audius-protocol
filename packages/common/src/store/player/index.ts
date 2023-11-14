import * as selectors from './selectors'
export {
  default as playerReducer,
  actions as playerActions,
  initialState as initialPlayerState
} from './slice'
export const playerSelectors = selectors
export { PLAYBACK_RATE_LS_KEY, PlaybackRate } from './types'
export { sagas as playerSagas } from './sagas'
