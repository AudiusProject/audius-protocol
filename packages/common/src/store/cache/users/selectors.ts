import {
  getUserQueryKey,
  getUserByHandleQueryKey
} from '~/api/tan-query/queryKeys'
import { getAllEntries, getEntryTimestamp } from '~/store/cache/selectors'
import type { CommonState } from '~/store/commonStore'

import { Kind } from '../../../models'
import type { ID, User } from '../../../models'

/** @deprecated use useUser instead */
export const getUser = (
  state: CommonState,
  props: { handle: string | null } | { id: ID | null }
) => {
  // const handle = 'handle' in props ? props.handle : null
  // const id = 'id' in props ? props.id : null
  return 'handle' in props
    ? state.queryClient.getQueryData(getUserByHandleQueryKey(props.handle))
    : state.queryClient.getQueryData(getUserQueryKey(props.id))
}

/** @deprecated use useUserByHandle instead */
export const getUserByHandle = (
  state: CommonState,
  props: { handle: string }
  // TODO: should we put some form of this into tan-query
) => state.users.handles[props.handle] || null

/** @deprecated use useUsers instead */
export const getUsers = (
  state: CommonState,
  props?: {
    ids?: ID[] | null
    handles?: string[] | null
  }
) => {
  if (props && props.ids) {
    const users: { [id: number]: User } = {}
    props.ids.forEach((id) => {
      const user = getUser(state, { id })
      if (user) {
        users[id] = user
      }
    })
    return users
  } else if (props && props.handles) {
    const users: { [handle: string]: User } = {}
    props.handles.forEach((handle) => {
      const id = getUserByHandle(state, { handle: handle?.toLowerCase() })
      if (id) {
        const user = getUser(state, { id })
        if (user) users[handle] = user
      }
    })
    return users
  }
  return getAllEntries(state, { kind: Kind.USERS })
}

/**
 * Selects from the cache and strips away cache-only fields.
 * @param {CommonState} state
 * @param {object} props { kind, ids }
 */
export const getUserTimestamps = (
  state: CommonState,
  {
    ids,
    handles
  }: {
    ids?: ID[] | null
    handles?: string[] | null
  }
) => {
  if (ids) {
    const entryTimestamps = ids.reduce(
      (acc, id) => {
        acc[id] = getEntryTimestamp(state, { kind: Kind.USERS, id })
        return acc
      },
      {} as { [id: number]: number | null }
    )
    return entryTimestamps
  } else if (handles) {
    return handles.reduce(
      (acc, handle) => {
        const id = getUserByHandle(state, { handle: handle.toLowerCase() })
        if (!id) return acc
        const timestamp = getEntryTimestamp(state, { kind: Kind.USERS, id })
        if (timestamp) acc[handle] = timestamp
        return acc
      },
      {} as { [handle: string]: number }
    )
  }
  return {}
}
