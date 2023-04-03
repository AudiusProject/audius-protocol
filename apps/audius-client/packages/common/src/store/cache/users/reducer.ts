import { Cache } from 'models/Cache'
import { ID } from 'models/Identifiers'
import { User } from 'models/User'
import { initialCacheState } from 'store/cache/reducer'

import { AddSuccededAction, ADD_SUCCEEDED } from '../actions'

import type { UsersCacheState } from './types'

const initialState: UsersCacheState = {
  ...(initialCacheState as unknown as Cache<User>),
  handles: {}
}

const actionsMap = {
  [ADD_SUCCEEDED](
    state: UsersCacheState,
    action: AddSuccededAction<User>
  ): UsersCacheState {
    const { entries } = action

    const newHandles: Record<string, ID> = {}

    for (const entry of entries) {
      const { user_id, handle } = entry.metadata
      newHandles[handle] = user_id
    }

    return {
      ...state,
      handles: {
        ...state.handles,
        ...newHandles
      }
    }
  }
}
const reducer = (
  state: UsersCacheState = initialState,
  action: AddSuccededAction<User>
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
