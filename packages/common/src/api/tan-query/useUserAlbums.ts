import { Id, OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'

type GetAlbumsOptions = {
  userId: number | null
  limit?: number
  offset?: number
}

export const getUserAlbumsQueryKey = (params: GetAlbumsOptions) => {
  const { userId, limit, offset } = params
  return [
    QUERY_KEYS.userAlbums,
    userId,
    {
      limit,
      offset
    }
  ]
}

export const useUserAlbums = (
  params: GetAlbumsOptions,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, limit, offset } = params
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: collectionIds } = useQuery({
    queryKey: getUserAlbumsQueryKey(params),
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

      return collections?.map((collection) => collection.playlist_id) ?? []
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })

  return useCollections(collectionIds)
}
