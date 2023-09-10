import { makeReducer } from 'utils/reducer'

import { INCREMENT_COUNT, DECREMENT_COUNT } from './actions'
import { ScrollLockState } from './types'

const initialState: ScrollLockState = {
  lockCount: 0
}

const actionMap = {
  [INCREMENT_COUNT](state: ScrollLockState): ScrollLockState {
    return {
      ...state,
      lockCount: state.lockCount + 1
    }
  },

  [DECREMENT_COUNT](state: ScrollLockState): ScrollLockState {
    return {
      ...state,
      lockCount: Math.max(state.lockCount - 1, 0)
    }
  }
}

export default makeReducer(actionMap, initialState)
