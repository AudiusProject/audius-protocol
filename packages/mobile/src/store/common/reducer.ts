import type { CommonState } from 'audius-client/src/common/store'

import type { CommonActions } from './actions'
import { RECEIVE } from './actions'

// Not using reduxjs/toolkit here because immer performance was less than optimal
// for this reducer that gets hit very often
export const reducer = (
  state: Partial<CommonState> = {},
  action: CommonActions
) => {
  switch (action.type) {
    case RECEIVE:
      return { ...state, ...action.payload }
    default:
      break
  }

  return state
}
