import { full } from '@audius/sdk'

import { createApi } from 'audius-query'
import { ID, Kind, StringUSDC } from 'models'
import {
  USDCTransactionDetails,
  USDCTransactionMethod,
  USDCTransactionType
} from 'models/USDCTransactions'
import { getRootSolanaAccount } from 'services/audius-backend/solana'
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

const makeParseTransaction =
  (rootSolanaAccount: Nullable<string>) =>
  (transaction: full.TransactionDetails): USDCTransactionDetails => {
    const { change, balance, transactionType, method, metadata, ...rest } =
      transaction
    return {
      ...rest,
      metadata: !rootSolanaAccount
        ? metadata
        : rootSolanaAccount === metadata.toString()
        ? `Cash (${metadata})`
        : metadata,
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
        { id, currentUserId }: { id: ID; currentUserId: Nullable<ID> },
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
    getUserByHandle: {
      fetch: async (
        {
          handle,
          currentUserId,
          retry = true
        }: { handle: string; currentUserId: Nullable<ID>; retry?: boolean },
        { apiClient }
      ) => {
        const apiUser = await apiClient.getUserByHandle({
          handle,
          currentUserId,
          retry
        })
        return apiUser?.[0]
      },
      options: {
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
    getTracksByUser: {
      fetch: async (
        { userId, currentUserId }: { userId: ID; currentUserId: Nullable<ID> },
        audiusQueryContext
      ) => {
        const { apiClient } = audiusQueryContext
        const { handle } = await userApiFetch.getUserById(
          { id: userId, currentUserId },
          audiusQueryContext
        )
        const tracks = await apiClient.getUserTracksByHandle({
          handle,
          currentUserId,
          getUnlisted: userId === currentUserId
        })
        return tracks
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
        // When fetching withdrawals, get the root account to display
        // additional transaction context
        if (
          type === full.GetUSDCTransactionsTypeEnum.Transfer &&
          method === full.GetUSDCTransactionCountMethodEnum.Send
        ) {
          const rootSolanaAccount = (
            await getRootSolanaAccount(context.audiusBackend)
          ).publicKey.toString()

          return data.map(makeParseTransaction(rootSolanaAccount))
        }
        return data.map(makeParseTransaction(null))
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
      options: { retry: true }
    }
  }
})

export const {
  useGetUserById,
  useGetUsersByIds,
  useGetUserByHandle,
  useGetTracksByUser,
  useGetUSDCTransactions,
  useGetUSDCTransactionsCount
} = userApi.hooks
export const userApiReducer = userApi.reducer
export const userApiFetch = userApi.fetch
export const userApiActions = userApi.actions
