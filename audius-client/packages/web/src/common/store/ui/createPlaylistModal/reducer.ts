import { ID } from 'common/models/Identifiers'

import { OPEN, CLOSE } from './actions'
import { CreatePlaylistModalState } from './types'

const initialState = {
  isOpen: false,
  collectionId: null
}

const actionsMap = {
  [OPEN](state: CreatePlaylistModalState, action: { collectionId: ID }) {
    return {
      ...state,
      isOpen: true,
      collectionId: action.collectionId
    }
  },
  [CLOSE](state: CreatePlaylistModalState) {
    return {
      ...state,
      isOpen: false,
      collectionId: null
    }
  }
}

const reducer = (
  state = initialState,
  action: { type: keyof typeof actionsMap }
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action as any)
}

export default reducer
