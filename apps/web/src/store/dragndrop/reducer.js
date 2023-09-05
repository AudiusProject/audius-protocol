import { DRAG, DROP } from 'store/dragndrop/actions'

const initialState = {
  dragging: false,
  isOwner: false,
  kind: null,
  id: null
}

const actionsMap = {
  [DRAG](state, action) {
    return {
      ...state,
      dragging: true,
      kind: action.kind,
      id: action.id,
      isOwner: action.isOwner
    }
  },
  [DROP](state, action) {
    return {
      ...state,
      dragging: false,
      kind: null,
      id: null,
      isOwner: false
    }
  }
}

const dragndrop = (state = initialState, action) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default dragndrop
