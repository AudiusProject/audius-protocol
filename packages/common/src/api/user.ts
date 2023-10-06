import type { full } from '@audius/sdk'

import { createApi } from 'audius-query'
import { ID, Kind, StringUSDC } from 'models'
import {
  USDCTransactionDetails,
  USDCTransactionMethod,
  USDCTransactionType
} from 'models/USDCTransactions'
import { Nullable } from 'utils/typeUtils'

import { Id } from './utils'

type GetUSDCTransactionListArgs = {
  userId: Nullable<ID>
  offset: number
  limit: number
  sortMethod?: full.GetUSDCTransactionsSortMethodEnum
  sortDirection?: full.GetUSDCTransactionsSortDirectionEnum
  type?: full.GetUSDCTransactionsTypeEnum
  method?: full.GetUSDCTransactionsMethodEnum
}

const parseTransaction = (
  transaction: full.TransactionDetails
): USDCTransactionDetails => {
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
    getUserById: {
      fetch: async (
        { id, currentUserId }: { id: ID; currentUserId: ID },
        { apiClient }
      ) => {
        const apiUser = await apiClient.getUser({ userId: id, currentUserId })
        return apiUser?.[0]
      },
      options: {
        idArgKey: 'id',
        kind: Kind.USERS,
        schemaKey: 'user'
      }
    },
    getUsersByIds: {
      fetch: async (args: { ids: ID[] }, context) => {
        const { ids } = args
        const { audiusBackend } = context
        return await audiusBackend.getCreators(ids)
      },
      options: { idListArgKey: 'ids', kind: Kind.USERS, schemaKey: 'users' }
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
        const { data: encodedDataMessage, signature: encodedDataSignature } =
          await context.audiusBackend.signDiscoveryNodeRequest()
        const sdk = await context.audiusSdk()
        const { data = [] } = await sdk.full.users.getUSDCTransactions({
          limit,
          offset,
          sortDirection,
          sortMethod,
          id: Id.parse(userId!),
          type,
          method,
          encodedDataMessage,
          encodedDataSignature
        })

        return data.map(parseTransaction)
      },
      options: {}
    },
    getUSDCTransactionsCount: {
      fetch: async (
        {
          userId,
          type,
          method
        }: Pick<GetUSDCTransactionListArgs, 'userId' | 'type' | 'method'>,
        { audiusSdk, audiusBackend }
      ) => {
        const { data: encodedDataMessage, signature: encodedDataSignature } =
          await audiusBackend.signDiscoveryNodeRequest()
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getUSDCTransactionCount({
          id: Id.parse(userId!),
          type,
          method,
          encodedDataMessage,
          encodedDataSignature
        })
        return data ?? 0
      },
      options: {}
    }
  }
})

export const {
  useGetUserById,
  useGetUsersByIds,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount
} = userApi.hooks
export const userApiReducer = userApi.reducer
export const userApiFetch = userApi.fetch
export const userApiActions = userApi.actions
