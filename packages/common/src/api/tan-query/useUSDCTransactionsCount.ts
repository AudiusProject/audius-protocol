import { full, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

type UseUSDCTransactionsCountArgs = {
  type?: full.GetUSDCTransactionsTypeEnum[]
  method?: full.GetUSDCTransactionsMethodEnum
}

export const useUSDCTransactionsCount = (
  args?: UseUSDCTransactionsCountArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [
      QUERY_KEYS.usdcTransactionsCount,
      currentUserId,
      args?.type,
      args?.method
    ],
    queryFn: async () => {
      if (!currentUserId) return 0
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUSDCTransactionCount({
        id: Id.parse(currentUserId),
        type: args?.type,
        method: args?.method
      })
      return data ?? 0
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
