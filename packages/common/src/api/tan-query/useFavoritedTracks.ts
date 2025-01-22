import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { transformAndCleanList } from '~/adapters'
import { favoriteFromSDK } from '~/adapters/favorite'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

export const useFavoritedTracks = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.favoritedTracks, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getFavorites({
        id: Id.parse(userId)
      })

      return transformAndCleanList(data, favoriteFromSDK)
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
