import { QueryKey } from '@tanstack/react-query'

import {
  getUserQueryKey,
  getUserByHandleQueryKey,
  QUERY_KEYS
} from '~/api/tan-query/queryKeys'
import { getEntryTimestamp } from '~/store/cache/selectors'
import type { CommonState } from '~/store/commonStore'

import { Kind, UID } from '../../../models'
import type { ID, User } from '../../../models'

/** @deprecated use a tan-query method instead - either useUser for hooks or queryClient.getQueryData */
export const getUser = (
  state: CommonState,
  props: { handle?: string | null; id?: ID | null; uid?: UID | null }
): User | null => {
  let userId = props.id
  if (props.uid) {
    return null
  }
  if (props.handle) {
    userId = getUserByHandle(state, { handle: props.handle })
  }
  return state.queryClient.getQueryData(getUserQueryKey(userId)) ?? null
}

/** @deprecated use a tan-query method instead - either useUserByHandle for hooks or queryClient.getQueryData */
export const getUserByHandle = (
  state: CommonState,
  props: { handle: string | null }
): ID | null => {
  if (!props.handle) return null
  return (
    state.queryClient.getQueryData(getUserByHandleQueryKey(props.handle)) ??
    null
  )
}

const whereLog = {}
/** @deprecated use a tan-query method instead - either useUsers for hooks or queryClient.getQueriesData */
export const getUsers =
  (where: string) =>
  (
    state: CommonState,
    identifiers?: {
      ids?: ID[] | null
      handles?: string[] | null
    }
  ):
    | { [id: number]: User }
    | { [uid: string]: User }
    | { [permalink: string]: User } => {
    console.log('get user')
    const { ids, handles } = identifiers ?? {}
    if (ids) {
      return ids.reduce(
        (acc, id) => {
          const user = state.queryClient.getQueryData(getUserQueryKey(id))
          if (user) {
            acc[id] = user
          }
          return acc
        },
        {} as { [id: number]: User }
      )
    }
    if (handles) {
      return handles.reduce(
        (acc, handle) => {
          const userId = state.queryClient.getQueryData(
            getUserByHandleQueryKey(handle)
          )
          if (!userId) return acc
          const user = state.queryClient.getQueryData(getUserQueryKey(userId))
          if (user) acc[handle] = user
          return acc
        },
        {} as { [handle: string]: User }
      )
    }

    whereLog[where] = (whereLog[where] ?? 0) + 1
    console.log('batch get users', where, whereLog[where])
    // Returns all users in cache. TODO: need to deprecate this entirely
    const userQueryResults = state.queryClient.getQueriesData({
      queryKey: [QUERY_KEYS.user]
    })
    return userQueryResults.reduce((acc, queryData) => {
      const [, user] = queryData as [QueryKey, User]
      if (user !== undefined) {
        return {
          ...acc,
          [user.user_id]: user
        }
      }
      return acc
    }, {})
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
