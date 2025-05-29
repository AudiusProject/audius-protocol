import { call, select } from 'typed-redux-saga'

import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { AccountState } from '~/store'
import { getWalletAddresses } from '~/store/account/selectors'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'

import { QUERY_KEYS } from '../queryKeys'
import {
  getCurrentAccountQueryFn,
  getCurrentAccountQueryKey
} from '../users/account/useCurrentAccount'
import { getWalletAddressesQueryKey } from '../users/account/useWalletAddresses'
import { getUserQueryFn, getUserQueryKey } from '../users/useUser'
import {
  getUserByHandleQueryFn,
  getUserByHandleQueryKey
} from '../users/useUserByHandle'
import { isValidId } from '../utils/isValidId'

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
  const dispatch = yield* getContext('dispatch')
  const currentUserId = yield* call(queryCurrentUserId)
  const sdk = yield* getSDK()
  const userId = (yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getUserByHandleQueryKey(handle),
    queryFn: async () =>
      getUserByHandleQueryFn(handle, sdk, queryClient, dispatch, currentUserId)
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

export function* queryCurrentAccount() {
  const sdk = yield* getSDK()
  const queryClient = yield* getContext('queryClient')
  const localStorage = yield* getContext('localStorage')
  const walletAddresses = queryClient.getQueryData(
    getWalletAddressesQueryKey()
  ) ?? {
    currentUser: null,
    web3User: null
  }
  const dispatch = yield* getContext('dispatch')
  const currentUserWallet = walletAddresses.currentUser

  const queryData = yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getCurrentAccountQueryKey(),
    queryFn: async () =>
      getCurrentAccountQueryFn(
        sdk,
        localStorage,
        currentUserWallet,
        queryClient,
        dispatch
      )
  })

  return queryData as AccountState | null | undefined
}

export function* queryHasAccount() {
  const account = yield* call(queryCurrentAccount)
  return !!account?.userId
}

export function* queryIsAccountComplete() {
  const account = yield* call(queryCurrentAccount)
  if (!account) return false
  const accountUser = yield* call(queryUser, account?.userId)
  // an account is complete if it has a handle and name
  return !!accountUser?.handle && !!accountUser?.name
}

export function* queryAccountUser() {
  const account = yield* call(queryCurrentAccount)
  if (!account) return undefined
  const accountUser = yield* call(queryUser, account?.userId)
  return accountUser
}

export function* queryCurrentUserId() {
  const account = yield* call(queryCurrentAccount)
  return account?.userId
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
