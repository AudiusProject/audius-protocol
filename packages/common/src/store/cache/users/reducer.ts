import { Cache } from '~/models/Cache'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { User } from '~/models/User'
import { initialCacheState } from '~/store/cache/reducer'

import {
  AddEntriesAction,
  AddSuccededAction,
  ADD_ENTRIES,
  ADD_SUCCEEDED
} from '../actions'

import type { UsersCacheState } from './types'
import { Entry } from '../types'

const initialState: UsersCacheState = {
  ...(initialCacheState as unknown as Cache<User>),
  handles: {}
}

const addEntries = (state: UsersCacheState, entries: Entry[]) => {
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
    const cacheableEntries: Entry[] = Object.entries(matchingEntries).map(
      ([id, entry]) => ({
        id: parseInt(id, 10),
        metadata: entry
      })
    )
    return addEntries(state, cacheableEntries)
  }
}

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
