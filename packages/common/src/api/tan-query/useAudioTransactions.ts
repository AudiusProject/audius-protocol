import { full } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import {
  TransactionDetails,
  TransactionType,
  TransactionMethod
} from '~/store/ui/transaction-details/types'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'

type GetAudioTransactionsArgs = {
  offset?: number
  limit?: number
  sortMethod?: full.GetAudioTransactionsSortMethodEnum
  sortDirection?: full.GetAudioTransactionsSortDirectionEnum
}

const parseTransaction = (tx: full.TransactionDetails): TransactionDetails => {
  const transactionTypeMap: Record<string, TransactionType> = {
    purchase_stripe: TransactionType.PURCHASE,
    purchase_coinbase: TransactionType.PURCHASE,
    purchase_unknown: TransactionType.PURCHASE,
    'purchase unknown': TransactionType.PURCHASE,
    tip: TransactionType.TIP,
    user_reward: TransactionType.CHALLENGE_REWARD,
    trending_reward: TransactionType.TRENDING_REWARD,
    transfer: TransactionType.TRANSFER
  }

  const txType = transactionTypeMap[tx.transactionType]
  switch (txType) {
    case TransactionType.CHALLENGE_REWARD:
    case TransactionType.TRENDING_REWARD:
      return {
        signature: tx.signature,
        transactionType: txType,
        method: TransactionMethod.RECEIVE,
        date: tx.transactionDate,
        change: tx.change,
        balance: tx.balance,
        metadata: tx.metadata as unknown as string
      }
    case TransactionType.PURCHASE:
      return {
        signature: tx.signature,
        transactionType: txType,
        method:
          tx.method === 'purchase_stripe'
            ? TransactionMethod.STRIPE
            : tx.method === 'purchase_coinbase'
              ? TransactionMethod.COINBASE
              : TransactionMethod.RECEIVE,
        date: tx.transactionDate,
        change: tx.change,
        balance: tx.balance,
        metadata: undefined
      }
    case TransactionType.TIP:
    case TransactionType.TRANSFER:
      return {
        signature: tx.signature,
        transactionType: txType,
        method:
          tx.method === 'send'
            ? TransactionMethod.SEND
            : TransactionMethod.RECEIVE,
        date: tx.transactionDate,
        change: tx.change,
        balance: tx.balance,
        metadata: tx.metadata as unknown as string
      }
    default:
      throw new Error('Unknown Transaction')
  }
}

export const useAudioTransactions = (
  args: GetAudioTransactionsArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()
  const { offset = 0, limit = 10, sortMethod, sortDirection } = args

  // Extract user IDs from transactions and fetch user data
  const query = useQuery({
    queryKey: [
      QUERY_KEYS.audioTransactions,
      userId,
      offset,
      limit,
      sortMethod,
      sortDirection
    ],
    queryFn: async () => {
      if (!userId) return { txDetails: [], userIds: [] }

      const sdk = await audiusSdk()
      const response = await sdk.full.users.getAudioTransactions({
        id: userId.toString(),
        offset,
        limit,
        sortMethod,
        sortDirection
      })

      if (!response?.data) return { txDetails: [], userIds: [] }

      const txDetails = response.data.map((tx: full.TransactionDetails) =>
        parseTransaction(tx)
      )

      // Get user IDs from tip transactions
      const userIds = txDetails
        .map((tx: TransactionDetails) => {
          if (tx.transactionType === TransactionType.TIP) {
            return tx.metadata
          }
          return null
        })
        .filter((tx: string | null) => tx !== null)
        .filter(removeNullable)
        .map((id: string) => parseInt(id))

      return { txDetails, userIds }
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })

  // Fetch users data if there are any tip transactions
  const userIds = query.data?.userIds ?? []
  useUsers(userIds, { enabled: userIds.length > 0 })

  return {
    ...query,
    data: query.data?.txDetails ?? []
  }
}
