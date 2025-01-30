import { Id, OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export type UseRemixersCountArgs = {
  trackId?: ID | null | undefined
}

export const getRemixersCountQueryKey = ({ trackId }: UseRemixersCountArgs) => [
  QUERY_KEYS.remixersCount,
  trackId
]

export const useRemixersCount = (
  { trackId }: UseRemixersCountArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getRemixersCountQueryKey({ trackId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!currentUserId) return 0
      const { data = 0 } = await sdk.full.users.getRemixersCount({
        id: Id.parse(currentUserId),
        userId: Id.parse(currentUserId),
        trackId: OptionalId.parse(trackId)
      })
      return data
    },

    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
