import { OPEN, CLOSE } from './actions'

const initialState = {
  isOpen: false,
  collectionId: null
}

const actionsMap = {
  [OPEN](state, action) {
    return {
      ...state,
      isOpen: true,
      collectionId: action.collectionId
    }
  },
  [CLOSE](state, action) {
    return {
      ...state,
      isOpen: false,
      collectionId: null
    }
  }
}

const reducer = (state = initialState, action) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
