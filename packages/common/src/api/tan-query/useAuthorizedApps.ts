import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const useAuthorizedApps = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: userId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.authorizedApps, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.users.getAuthorizedApps({
        id: Id.parse(userId)
      })

      return data
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
