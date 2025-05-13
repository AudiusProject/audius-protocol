import { Dispatch, AnyAction } from 'redux'
import { call, select, put } from 'typed-redux-saga'

import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getUserId } from '~/store/account/selectors'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'

import { QUERY_KEYS } from '../queryKeys'
import { getUserQueryFn, getUserQueryKey } from '../users/useUser'
import {
  getUserByHandleQueryFn,
  getUserByHandleQueryKey
} from '../users/useUserByHandle'
import { isValidId } from '../utils/isValidId'

export function* queryUser(id: ID | null | undefined) {
  if (!isValidId(id)) return undefined
  const queryClient = yield* getContext('queryClient')
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

  const queryData = yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getUserQueryKey(id),
    queryFn: async () =>
      getUserQueryFn(id!, currentUserId, queryClient, sdk, put)
  })

  return queryData as User | undefined
}

export function* queryUserByHandle(handle: string | null | undefined) {
  if (!handle) return undefined
  const queryClient = yield* getContext('queryClient')
  const currentUserId = yield* select(getUserId)
  const sdk = yield* getSDK()
  const userId = (yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getUserByHandleQueryKey(handle),
    queryFn: async () =>
      getUserByHandleQueryFn(
        handle,
        sdk,
        queryClient,
        put as Dispatch<AnyAction>,
        currentUserId
      )
  })) as ID | undefined
  if (!userId) return undefined
  const userMetadata = yield* call(queryUser, userId)
  return userMetadata
}

export function* queryUsers(ids: ID[]) {
  const users = {} as Record<ID, User>
  for (const id of ids) {
    // Call each queryUser individually. They will be batched together in the queryFn (if necessary)
    const user = yield* call(queryUser, id)
    if (user) {
      users[id] = user
    }
  }
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
