import { full, Id, OptionalId } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'

type GetAlbumsOptions = {
  userId: number | null
  pageSize?: number
  sortMethod?: full.GetAlbumsByUserSortMethodEnum
}

export const getUserAlbumsQueryKey = (params: GetAlbumsOptions) => {
  const { userId, pageSize, sortMethod } = params
  return [
    QUERY_KEYS.userAlbums,
    userId,
    {
      pageSize,
      sortMethod
    }
  ] as unknown as QueryKey<InfiniteData<ID[]>>
}

export const useUserAlbums = (
  params: GetAlbumsOptions,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, pageSize = 10, sortMethod = 'recent' } = params
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
    queryKey: getUserAlbumsQueryKey(params),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      if (!userId) return []

      const sdk = await audiusSdk()

      const { data } = await sdk.full.users.getAlbumsByUser({
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

  const { data: collections } = useCollections(queryRes.data)

  return {
    data: collections,
    isPending: queryRes.isPending,
    isLoading: queryRes.isLoading,
    hasNextPage: queryRes.hasNextPage,
    isFetchingNextPage: queryRes.isFetchingNextPage,
    fetchNextPage: queryRes.fetchNextPage
  }
}
