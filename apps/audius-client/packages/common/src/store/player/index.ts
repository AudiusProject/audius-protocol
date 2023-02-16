export {
  default as playerReducer,
  actions as playerActions,
  initialState as initialPlayerState
} from './slice'
export * as playerSelectors from './selectors'
export * from './types'
export { sagas as playerSagas } from './sagas'
