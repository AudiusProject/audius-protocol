import { full, HashId, Id } from '@audius/sdk'

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

        return data
      },
      options: {}
    },
    getMutedUsers: {
      async fetch({ userId }: { userId: ID }, { audiusSdk }) {
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
  useGetUserAccount,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount,
  useGetRemixedTracks,
  useGetSalesAggegrate,
  useGetMutedUsers
} = userApi.hooks
export const userApiReducer = userApi.reducer
export const userApiFetch = userApi.fetch
export const userApiFetchSaga = userApi.fetchSaga
export const userApiActions = userApi.actions
export const userApiUtils = userApi.util
