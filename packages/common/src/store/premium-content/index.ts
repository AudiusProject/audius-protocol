import * as selectors from './selectors'
export {
  default as premiumContentReducer,
  actions as premiumContentActions
} from './slice'
export const premiumContentSelectors = selectors
export { sagas as premiumContentSagas } from './sagas'
