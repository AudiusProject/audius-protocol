// @ts-nocheck
// TODO(nkang) - convert to TS
import { initialCacheState } from 'store/cache/reducer'
import { SET_HANDLE_STATUS } from 'store/cache/users/actions'

const initialState = {
  ...initialCacheState,
  handles: {}
}

const actionsMap = {
  [SET_HANDLE_STATUS](state, action) {
    return {
      ...state,
      handles: {
        ...state.handles,
        ...action.statuses.reduce((handleStatuses, status) => {
          handleStatuses[status.handle.toLowerCase()] = {
            id: status.id,
            status: status.status
          }
          return handleStatuses
        }, {})
      }
    }
  }
}
const reducer = (state = initialState, action) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
