import { useQuery } from '@tanstack/react-query'

import { transformAndCleanList } from '~/adapters'
import { favoriteFromSDK } from '~/adapters/favorite'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  enabled?: boolean
  staleTime?: number
}

export const useFavoritedTracks = (userId: Nullable<ID>, config?: Config) => {
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
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
