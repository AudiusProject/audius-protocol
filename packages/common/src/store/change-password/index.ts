import * as selectors from './selectors'
export const changePasswordSelectors = selectors
export {
  default as changePasswordReducer,
  actions as changePasswordActions
} from './slice'
export { ChangePasswordPageStep, ChangePasswordState } from './types'
