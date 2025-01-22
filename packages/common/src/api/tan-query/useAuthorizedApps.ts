import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useAuthorizedApps = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

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
