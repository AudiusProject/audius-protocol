import * as selectors from './selectors'

export {
  default as deactivateAccountReducer,
  actions as deactivateAccountActions
} from './slice'
export type { DeactivateAccountState } from './slice'
export const deactivateAccountSelectors = selectors
