import { Id, OptionalId } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

type UseRemixersCountArgs = {
  userId: ID | null | undefined
  trackId?: ID | null | undefined
}

export const useRemixersCount = (
  { userId, trackId }: UseRemixersCountArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.remixersCount, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()

      const { data = 0 } = await sdk.full.users.getRemixersCount({
        id: Id.parse(userId),
        userId: Id.parse(userId),
        trackId: OptionalId.parse(trackId)
      })
      return data
    },

    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!userId
  })
}
