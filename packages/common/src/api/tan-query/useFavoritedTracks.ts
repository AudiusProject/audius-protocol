import { useQuery } from '@tanstack/react-query'

import { transformAndCleanList } from '~/adapters'
import { favoriteFromSDK } from '~/adapters/favorite'
import { useAppContext } from '~/context/appContext'
import { ID, Id } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'

type Config = {
  enabled?: boolean
  staleTime?: number
}

export const useFavoritedTracks = (userId: Nullable<ID>, config?: Config) => {
  const { audiusSdk } = useAppContext()

  return useQuery({
    queryKey: [QUERY_KEYS.favoritedTracks, userId],
    queryFn: async () => {
      const { data } = await audiusSdk!.users.getFavorites({
        id: Id.parse(userId)
      })

      return transformAndCleanList(data, favoriteFromSDK)
    },
    staleTime: config?.staleTime,
    enabled:
      config?.enabled !== false &&
      !!audiusSdk &&
      userId !== null &&
      userId !== undefined
  })
}
