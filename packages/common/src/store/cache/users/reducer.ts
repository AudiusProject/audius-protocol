import { Cache } from '~/models/Cache'
import { Kind } from '~/models/Kind'
import { User } from '~/models/User'
import { initialCacheState } from '~/store/cache/reducer'

import type { UsersCacheState } from './types'

const initialState: UsersCacheState = {
  ...(initialCacheState as unknown as Cache<User>),
  handles: {}
}

const actionsMap = {}

// TODO: delete this reducer entirely
const reducer = (
  state: UsersCacheState = initialState,
  action: any,
  kind: Kind
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action, kind)
}

export default reducer
