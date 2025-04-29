import { full, HashId, Id, OptionalId } from '@audius/sdk'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { accountFromSDK, userMetadataListFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { ID, Kind, StringUSDC } from '~/models'
import {
  USDCTransactionDetails,
  USDCTransactionMethod,
  USDCTransactionType
} from '~/models/USDCTransactions'
import { isResponseError } from '~/utils'
import { Nullable } from '~/utils/typeUtils'

import { SDKRequest } from './types'

type GetUSDCTransactionListArgs = {
  userId: Nullable<ID>
  offset: number
  limit: number
  sortMethod?: full.GetUSDCTransactionsSortMethodEnum
  sortDirection?: full.GetUSDCTransactionsSortDirectionEnum
  type?: full.GetUSDCTransactionsTypeEnum[]
  method?: full.GetUSDCTransactionsMethodEnum
}

/**
 * Parser to reformat transactions as they come back from the API.
 * @param transaction the transaction to parse
 */
const parseTransaction = ({
  transaction
}: {
  transaction: full.TransactionDetails
}): USDCTransactionDetails => {
  const { change, balance, transactionType, method, ...rest } = transaction
  return {
    ...rest,
    transactionType: transactionType as USDCTransactionType,
    method: method as USDCTransactionMethod,
    change: change as StringUSDC,
    balance: balance as StringUSDC
  }
}

const userApi = createApi({
  reducerPath: 'userApi',
  endpoints: {
    // TODO: Remove this once saga calls are removed
    getUserAccount: {
      fetch: async ({ wallet }: { wallet: string }, { audiusSdk }) => {
        try {
          const sdk = await audiusSdk()
          const { data } = await sdk.full.users.getUserAccount({ wallet })
          if (!data) {
            console.warn('Missing user from account response')
            return null
          }

          return accountFromSDK(data)
        } catch (e) {
          // Account doesn't exist, don't bubble up an error, just return null
          if (isResponseError(e) && [401, 404].includes(e.response.status)) {
            return null
          }
          throw e
        }
      },
      options: {
        schemaKey: 'accountUser'
      }
    },
    getUserByHandle: {
      fetch: async (
        {
          handle,
          currentUserId
        }: { handle: string; currentUserId: Nullable<ID> },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data: users = [] } = await sdk.full.users.getUserByHandle({
          handle,
          userId: OptionalId.parse(currentUserId)
        })
        return userMetadataListFromSDK(users)[0]
      },
      options: {
        kind: Kind.USERS,
        schemaKey: 'user'
      }
    },
    getUsersByIds: {
      fetch: async (
        args: { ids: ID[]; currentUserId?: Nullable<ID> },
        { audiusSdk }
      ) => {
        const { ids, currentUserId } = args
        const sdk = await audiusSdk()
        const { data: users = [] } = await sdk.full.users.getBulkUsers({
          id: ids.map((id) => Id.parse(id)),
          userId: OptionalId.parse(currentUserId)
        })
        return userMetadataListFromSDK(users)
      },
      options: { idListArgKey: 'ids', kind: Kind.USERS, schemaKey: 'users' }
    },
    getTracksByUser: {
      fetch: async (
        {
          id,
          currentUserId,
          ...params
        }: {
          id: ID
        } & SDKRequest<full.GetTracksByUserRequest>,
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.users.getTracksByUser({
          ...params,
          id: Id.parse(id),
          userId: OptionalId.parse(currentUserId)
        })
        return transformAndCleanList(data, userTrackMetadataFromSDK)
      },
      options: {
        kind: Kind.TRACKS,
        schemaKey: 'tracks'
      }
    },
    getUSDCTransactions: {
      fetch: async (
        {
          offset,
          limit,
          userId,
          sortDirection,
          sortMethod,
          type,
          method
        }: GetUSDCTransactionListArgs,
        context
      ) => {
        const sdk = await context.audiusSdk()
        const { data = [] } = await sdk.full.users.getUSDCTransactions({
          limit,
          offset,
          sortDirection,
          sortMethod,
          id: Id.parse(userId!),
          type,
          method
        })

        return data.map((transaction) => parseTransaction({ transaction }))
      },
      options: { retry: true }
    },
    getUSDCTransactionsCount: {
      fetch: async (
        {
          userId,
          type,
          method
        }: Pick<GetUSDCTransactionListArgs, 'userId' | 'type' | 'method'>,
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getUSDCTransactionCount({
          id: Id.parse(userId!),
          type,
          method
        })
        return data ?? 0
      },
      options: { retry: true }
    },
    getFollowers: {
      fetch: async (
        {
          userId,
          limit = 10,
          offset = 0
        }: { userId: ID | null | undefined; offset?: number; limit?: number },
        { audiusSdk }
      ) => {
        if (!userId) {
          return []
        }
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.users.getFollowers({
          id: Id.parse(userId),
          limit,
          offset
        })
        return userMetadataListFromSDK(data)
      },
      options: {
        kind: Kind.USERS,
        schemaKey: 'users'
      }
    },
    getRemixers: {
      fetch: async (
        {
          userId,
          trackId,
          limit = 10,
          offset = 0
        }: { userId: ID; trackId?: string; offset?: number; limit?: number },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data: users = [] } = await sdk.full.users.getRemixers({
          id: Id.parse(userId),
          trackId,
          limit,
          offset
        })
        return userMetadataListFromSDK(users)
      },
      options: {
        kind: Kind.USERS,
        schemaKey: 'users'
      }
    },
    getRemixersCount: {
      fetch: async (
        { userId, trackId }: { userId: ID; trackId?: number },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getRemixersCount({
          id: Id.parse(userId),
          userId: Id.parse(userId),
          trackId: OptionalId.parse(trackId)
        })
        return data
      },
      options: {}
    },
    getPurchasers: {
      fetch: async (
        {
          userId,
          contentId,
          contentType,
          limit = 10,
          offset = 0
        }: {
          userId: ID
          contentId?: number
          contentType?: string
          offset?: number
          limit?: number
        },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.full.users.getPurchasers({
          id: Id.parse(userId),
          contentId: OptionalId.parse(contentId),
          contentType,
          limit,
          offset
        })
        return userMetadataListFromSDK(data)
      },
      options: {
        kind: Kind.USERS,
        schemaKey: 'users'
      }
    },
    getPurchasersCount: {
      fetch: async (
        {
          userId,
          contentId,
          contentType
        }: { userId: ID; contentId?: number; contentType?: string },
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getPurchasersCount({
          id: Id.parse(userId),
          contentId: OptionalId.parse(contentId),
          contentType
        })
        return data ?? 0
      },
      options: {}
    },
    getRemixedTracks: {
      fetch: async ({ userId }: { userId: ID }, { audiusSdk }) => {
        const sdk = await audiusSdk()
        const { data = [] } = await sdk.users.getUserTracksRemixed({
          id: Id.parse(userId)
        })

        return data.map((item) => ({
          ...item,
          trackId: HashId.parse(item.trackId)
        }))
      },
      options: {}
    },
    getSalesAggegrate: {
      fetch: async ({ userId }: { userId: ID }, { audiusSdk }) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.users.getSalesAggregate({
          id: Id.parse(userId)
        })

        return data?.map((sale) => ({
          ...sale,
          contentId: parseInt(sale.contentId)
        }))
      },
      options: {}
    },
    getMutedUsers: {
      async fetch({ userId }: { userId: Nullable<ID> }, { audiusSdk }) {
        if (!userId) return []
        const encodedUserId = Id.parse(userId)
        const sdk = await audiusSdk()
        const { data: users } = await sdk.full.users.getMutedUsers({
          id: encodedUserId
        })
        return userMetadataListFromSDK(users)
      },

      options: { kind: Kind.USERS, schemaKey: 'users' }
    }
  }
})

export const {
  useGetUsersByIds,
  useGetUserByHandle,
  useGetTracksByUser,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount,
  useGetFollowers,
  useGetRemixers,
  useGetRemixersCount,
  useGetPurchasers,
  useGetPurchasersCount,
  useGetRemixedTracks,
  useGetSalesAggegrate,
  useGetMutedUsers
} = userApi.hooks
export const userApiReducer = userApi.reducer
export const userApiFetch = userApi.fetch
export const userApiFetchSaga = userApi.fetchSaga
export const userApiActions = userApi.actions
export const userApiUtils = userApi.util
