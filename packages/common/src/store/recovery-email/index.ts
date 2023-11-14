import * as selectors from './selectors'

export {
  default as recoveryEmailReducer,
  actions as recoveryEmailActions
} from './slice'
export type { RecoveryEmailState } from './slice'
export const recoveryEmailSelectors = selectors
