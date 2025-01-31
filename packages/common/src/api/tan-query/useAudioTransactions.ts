import { full, Id } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

import { audioTransactionFromSdk } from '~/adapters/audioTransactions'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import {
  TransactionDetails,
  TransactionType
} from '~/store/ui/transaction-details/types'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'

type GetAudioTransactionsArgs = {
  pageSize?: number
  sortMethod?: full.GetAudioTransactionsSortMethodEnum
  sortDirection?: full.GetAudioTransactionsSortDirectionEnum
}

const AUDIO_TRANSACTIONS_BATCH_SIZE = 50

export const getAudioTransactionsQueryKey = ({
  userId,
  sortMethod,
  sortDirection,
  pageSize
}: GetAudioTransactionsArgs & { userId: Nullable<ID> }) => [
  QUERY_KEYS.audioTransactions,
  userId,
  {
    sortMethod,
    sortDirection,
    pageSize
  }
]

export const useAudioTransactions = (
  args: GetAudioTransactionsArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()
  const {
    pageSize = AUDIO_TRANSACTIONS_BATCH_SIZE,
    sortMethod,
    sortDirection
  } = args

  const query = useInfiniteQuery({
    queryKey: getAudioTransactionsQueryKey({
      userId,
      sortMethod,
      sortDirection,
      pageSize
    }),
    queryFn: async ({ pageParam }) => {
      if (!userId) return []

      const sdk = await audiusSdk()
      const response = await sdk.full.users.getAudioTransactions({
        id: Id.parse(userId),
        offset: pageParam,
        limit: pageSize,
        sortMethod,
        sortDirection
      })

      if (!response?.data) return []

      const txDetails = response.data.map(audioTransactionFromSdk)
      return txDetails
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })

  const pages = query.data?.pages
  // Get user IDs from tip transactions
  const userIds = pages?.[pages.length - 1]
    ?.map((tx: TransactionDetails) => {
      if (tx.transactionType === TransactionType.TIP) {
        return tx.metadata
      }
      return null
    })
    .filter((tx: string | null) => tx !== null)
    .filter(removeNullable)
    .map((id: string) => parseInt(id))

  useUsers(userIds, { enabled: !!userIds?.length })

  return {
    ...query,
    data: query.data?.pages.flat() ?? []
  }
}
