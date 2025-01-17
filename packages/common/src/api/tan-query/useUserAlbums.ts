import { Id, OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'

type GetAlbumsOptions = {
  userId: number | null
  limit?: number
  offset?: number
}

export const useUserAlbums = (options: GetAlbumsOptions, config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, limit, offset } = options
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.userAlbums, userId, limit, offset],
    queryFn: async () => {
      if (!userId) return []

      const sdk = await audiusSdk()

      const { data } = await sdk.full.users.getAlbumsByUser({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId),
        limit,
        offset
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({ collections, queryClient, dispatch })

      return collections
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
