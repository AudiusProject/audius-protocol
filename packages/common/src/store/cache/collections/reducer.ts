import { initialCacheState } from '~/store/cache/reducer'

import { Kind } from '../../../models'

const initialState = {
  ...initialCacheState,
  permalinks: {}
}

const actionsMap = {}

// TODO: delete this reducer entirely
const reducer = (state = initialState, action: any, kind: Kind) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action, kind)
}

export default reducer
