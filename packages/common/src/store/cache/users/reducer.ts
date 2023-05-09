import { Cache } from 'models/Cache'
import { ID } from 'models/Identifiers'
import { Kind } from 'models/Kind'
import { User } from 'models/User'
import { initialCacheState } from 'store/cache/reducer'

import {
  AddEntriesAction,
  AddSuccededAction,
  ADD_ENTRIES,
  ADD_SUCCEEDED
} from '../actions'

import type { UsersCacheState } from './types'

const initialState: UsersCacheState = {
  ...(initialCacheState as unknown as Cache<User>),
  handles: {}
}

const addEntries = (state: UsersCacheState, entries: any[]) => {
  const newHandles: Record<string, ID> = {}

  for (const entry of entries) {
    const { user_id, handle } = entry.metadata
    if (handle) {
      newHandles[handle.toLowerCase()] = user_id
    }
  }

  return {
    ...state,
    handles: {
      ...state.handles,
      ...newHandles
    }
  }
}

const actionsMap = {
  [ADD_SUCCEEDED](
    state: UsersCacheState,
    action: AddSuccededAction<User>
  ): UsersCacheState {
    const { entries } = action
    return addEntries(state, entries)
  },
  [ADD_ENTRIES](
    state: UsersCacheState,
    action: AddEntriesAction<User>,
    kind: Kind
  ): UsersCacheState {
    const { entriesByKind } = action
    const matchingEntries = entriesByKind[kind]

    if (!matchingEntries) return state
    return addEntries(state, matchingEntries)
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
