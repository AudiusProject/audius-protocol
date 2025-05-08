import { Id, OptionalId, full } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useQueryContext } from '~/api'
import { ID } from '~/models/Identifiers'

import { useCollections } from '../collection/useCollections'
import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { primeCollectionData } from '../utils/primeCollectionData'

import { useCurrentUserId } from './account/useCurrentUserId'

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
  ] as unknown as QueryKey<InfiniteData<ID[]>>
}

export const useUserPlaylists = (
  params: GetPlaylistsOptions,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { userId, pageSize = 10, sortMethod = 'recent' } = params
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
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
