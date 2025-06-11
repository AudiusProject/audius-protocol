import { all, call } from 'typed-redux-saga'

import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'

import { QUERY_KEYS } from '../queryKeys'
import { getUserQueryFn, getUserQueryKey } from '../users/useUser'
import {
  getUserByHandleQueryFn,
  getUserByHandleQueryKey
} from '../users/useUserByHandle'
import { entityCacheOptions } from '../utils/entityCacheOptions'
import { isValidId } from '../utils/isValidId'

import { queryCurrentUserId } from './queryAccount'

export function* queryUser(id: ID | null | undefined) {
  if (!isValidId(id)) return undefined
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  const sdk = yield* getSDK()
  const currentUserId = yield* call(queryCurrentUserId)

  const queryData = yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getUserQueryKey(id),
    queryFn: async () =>
      getUserQueryFn(id!, currentUserId, queryClient, sdk, dispatch)
  })

  return queryData as User | undefined
}

export function* queryUserByHandle(handle: string | null | undefined) {
  if (!handle) return undefined
  const queryClient = yield* getContext('queryClient')
  const currentUserId = yield* call(queryCurrentUserId)
  const sdk = yield* getSDK()
  const userId = (yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getUserByHandleQueryKey(handle),
    queryFn: async () =>
      getUserByHandleQueryFn(handle, sdk, queryClient, currentUserId),
    ...entityCacheOptions
  })) as ID | undefined
  if (!userId) return undefined
  const userMetadata = yield* call(queryUser, userId)
  return userMetadata
}

export function* queryUsers(ids: ID[]) {
  const users = {} as Record<ID, User>
  const userResults = yield* all(ids.map((id) => call(queryUser, id)))

  userResults.forEach((user, index) => {
    if (user) {
      users[ids[index]] = user
    }
  })

  return users
}

export function* queryAllCachedUsers() {
  const queryClient = yield* getContext('queryClient')
  const queries = queryClient.getQueriesData<User>({
    queryKey: [QUERY_KEYS.user]
  })
  return queries.reduce(
    (acc, [_, user]) => {
      if (user?.user_id) {
        acc[user.user_id] = user
      }
      return acc
    },
    {} as Record<ID, User>
  )
}
