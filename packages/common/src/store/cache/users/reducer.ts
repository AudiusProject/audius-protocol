import snakecaseKeys from 'snakecase-keys'

import { Cache } from '~/models/Cache'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { SsrPageProps } from '~/models/SsrPageProps'
import { User } from '~/models/User'
import { makeUser } from '~/services/audius-api-client/ResponseAdapter'
import { initialCacheState } from '~/store/cache/reducer'
import { makeUid } from '~/utils/uid'

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

const buildInitialState = (ssrPageProps?: SsrPageProps) => {
  // TODO: support user profile page. Only track page supported for now.

  // If we have preloaded data from the server, populate the initial
  // cache state with it
  if (ssrPageProps?.track) {
    // @ts-ignore
    const user = makeUser(snakecaseKeys(ssrPageProps.track.user))
    if (!user) return initialState

    const id = user.user_id
    const uid = makeUid(Kind.USERS, id)

    const initialCacheState = {
      ...initialState,
      entries: {
        [id]: {
          metadata: user,
          _timestamp: Date.now()
        }
      },
      uids: {
        [uid]: user.user_id
      },
      statuses: {
        [id]: 'SUCCESS'
      }
    }
    return initialCacheState
  }
  return initialState
}

const reducer =
  (ssrPageProps: SsrPageProps) =>
  (state: UsersCacheState, action: AddSuccededAction<User>) => {
    if (!state) {
      // @ts-ignore
      state = buildInitialState(ssrPageProps)
    }

    const matchingReduceFunction = actionsMap[action.type]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }

export default reducer
