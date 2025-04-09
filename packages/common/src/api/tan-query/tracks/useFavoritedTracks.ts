import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { transformAndCleanList } from '~/adapters'
import { favoriteFromSDK } from '~/adapters/favorite'
import { useAudiusQueryContext } from '~/audius-query'
import { Favorite } from '~/models/Favorite'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'

export const getFavoritedTracksQueryKey = (userId: ID | null | undefined) => {
  return [QUERY_KEYS.favoritedTracks, userId] as unknown as QueryKey<Favorite[]>
}

export const useFavoritedTracks = (
  userId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getFavoritedTracksQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getFavorites({
        id: Id.parse(userId)
      })

      return transformAndCleanList(data, favoriteFromSDK)
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
