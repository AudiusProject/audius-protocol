import { initialCacheState } from 'common/store/cache/reducer'
import { SET_PERMALINK_STATUS } from 'common/store/cache/tracks/actions'

const initialState = {
  ...initialCacheState,
  permalinks: {}
}
const actionsMap = {
  [SET_PERMALINK_STATUS](state, action) {
    return {
      ...state,
      permalinks: {
        ...state.permalinks,
        ...action.statuses.reduce((permalinkStatuses, status) => {
          permalinkStatuses[status.permalink.toLowerCase()] = {
            id: status.id,
            status: status.status
          }
          return permalinkStatuses
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
