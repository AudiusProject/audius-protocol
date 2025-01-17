import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const useAudioTransactionsCount = (config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.audioTransactionsCount, userId],
    queryFn: async () => {
      if (!userId) return 0

      const sdk = await audiusSdk()
      const response = await sdk.full.users.getAudioTransactionCount({
        id: Id.parse(userId)
      })

      return response.data ?? 0
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
