import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useTypedQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

export type UseCollectionFavoritesArgs = {
  collectionId: ID | null | undefined
  pageSize?: number
}

export const getCollectionFavoritesQueryKey = ({
  collectionId,
  pageSize
}: UseCollectionFavoritesArgs) => [
  QUERY_KEYS.favorites,
  collectionId,
  { pageSize }
]

export const useCollectionFavorites = (
  { collectionId, pageSize = DEFAULT_PAGE_SIZE }: UseCollectionFavoritesArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: getCollectionFavoritesQueryKey({ collectionId, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.playlists.getUsersFromPlaylistFavorites({
        playlistId: Id.parse(collectionId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId)
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!collectionId
  })
}
