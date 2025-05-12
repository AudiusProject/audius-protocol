import { useMemo } from 'react'

import { full, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { audioTransactionFromSdk } from '~/adapters/audioTransactions'
import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'
import {
  TransactionDetails,
  TransactionType
} from '~/store/ui/transaction-details/types'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { useUsers } from '../users/useUsers'

type GetAudioTransactionsArgs = {
  page?: number
  pageSize?: number
  sortMethod?: full.GetAudioTransactionsSortMethodEnum
  sortDirection?: full.GetAudioTransactionsSortDirectionEnum
}

export const DEFAULT_AUDIO_TRANSACTIONS_BATCH_SIZE = 50

export const getAudioTransactionsQueryKey = ({
  userId,
  page,
  sortMethod,
  sortDirection,
  pageSize
}: GetAudioTransactionsArgs & { userId: Nullable<ID> }) =>
  [
    QUERY_KEYS.audioTransactions,
    userId,
    {
      page,
      sortMethod,
      sortDirection,
      pageSize
    }
  ] as unknown as QueryKey<TransactionDetails[]>

export const useAudioTransactions = (
  args: GetAudioTransactionsArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: userId } = useCurrentUserId()
  const {
    page = 0,
    pageSize = DEFAULT_AUDIO_TRANSACTIONS_BATCH_SIZE,
    sortMethod,
    sortDirection
  } = args

  const queryResults = useQuery({
    queryKey: getAudioTransactionsQueryKey({
      userId,
      page,
      sortMethod,
      sortDirection,
      pageSize
    }),
    queryFn: async () => {
      if (!userId) return []

      const sdk = await audiusSdk()
      const response = await sdk.full.users.getAudioTransactions({
        id: Id.parse(userId),
        offset: page * pageSize,
        limit: pageSize,
        sortMethod,
        sortDirection
      })

      if (!response?.data) return []

      return response.data.map(audioTransactionFromSdk)
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })

  // Get user IDs from tip transactions
  const userIds = useMemo(
    () =>
      queryResults.data
        ?.map((tx: TransactionDetails) => {
          if (tx.transactionType === TransactionType.TIP) {
            return tx.metadata
          }
          return null
        })
        .filter((tx: string | null) => tx !== null)
        .filter(removeNullable)
        .map((id: string) => parseInt(id)),
    [queryResults.data]
  )

  useUsers(userIds)

  return queryResults
}
