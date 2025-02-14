import { Id, OptionalId, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'

type GetPlaylistsOptions = {
  userId: number | null
  pageSize?: number
  sortMethod?: full.GetPlaylistsByUserSortMethodEnum
}

export const getUserPlaylistsQueryKey = (params: GetPlaylistsOptions) => {
  const { userId, pageSize, sortMethod } = params
  return [
    QUERY_KEYS.userPlaylists,
    userId,
    {
      pageSize,
      sortMethod
    }
  ]
}

export const useUserPlaylists = (
  params: GetPlaylistsOptions,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, pageSize = 10, sortMethod = 'recent' } = params
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: collectionIds } = useInfiniteQuery({
    queryKey: getUserPlaylistsQueryKey(params),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      if (!userId) return []

      const sdk = await audiusSdk()

      const { data } = await sdk.full.users.getPlaylistsByUser({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId),
        limit: pageSize,
        offset: pageParam as number,
        sortMethod
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({ collections, queryClient, dispatch })

      return collections.map((collection) => collection.playlist_id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!userId
  })

  return useCollections(collectionIds)
}
