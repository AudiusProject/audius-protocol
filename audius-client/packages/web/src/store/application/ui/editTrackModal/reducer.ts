import { ActionsMap } from 'utils/reducer'

import { OPEN, CLOSE, EditTrackModalActions } from './actions'
import EditTrackModalState from './types'

const initialState = {
  isOpen: false,
  trackId: null
}

const actionsMap: ActionsMap<EditTrackModalState> = {
  [OPEN](state, action) {
    return {
      ...state,
      isOpen: true,
      trackId: action.trackId
    }
  },
  [CLOSE](state, action) {
    return {
      ...state,
      isOpen: false,
      trackId: null
    }
  }
}

export default function search(
  state = initialState,
  action: EditTrackModalActions
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
