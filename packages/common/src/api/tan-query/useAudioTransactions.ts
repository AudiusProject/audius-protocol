import { full } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

import { audioTransactioFromSdk } from '~/adapters/audioTransactions'
import { useAudiusQueryContext } from '~/audius-query'
import { Id } from '~/models/Identifiers'
import {
  TransactionDetails,
  TransactionType
} from '~/store/ui/transaction-details/types'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'

type GetAudioTransactionsArgs = {
  limit?: number
  sortMethod?: full.GetAudioTransactionsSortMethodEnum
  sortDirection?: full.GetAudioTransactionsSortDirectionEnum
}

const AUDIO_TRANSACTIONS_BATCH_SIZE = 50

export const useAudioTransactions = (
  args: GetAudioTransactionsArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()
  const {
    limit = AUDIO_TRANSACTIONS_BATCH_SIZE,
    sortMethod,
    sortDirection
  } = args

  const query = useInfiniteQuery({
    queryKey: [QUERY_KEYS.audioTransactions, userId, sortMethod, sortDirection],
    queryFn: async ({ pageParam }) => {
      if (!userId) return { txDetails: [], userIds: [] }

      const sdk = await audiusSdk()
      const response = await sdk.full.users.getAudioTransactions({
        id: Id.parse(userId),
        offset: pageParam,
        limit,
        sortMethod,
        sortDirection
      })

      if (!response?.data) return { txDetails: [], userIds: [] }

      const txDetails = response.data.map(audioTransactioFromSdk)

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
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.txDetails.length < limit) return undefined
      return allPages.length
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })

  // Fetch users data if there are any tip transactions
  const userIds = query.data?.pages.flatMap((page) => page.userIds) ?? []
  useUsers(userIds, { enabled: userIds.length > 0 })

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.txDetails) ?? []
  }
}
