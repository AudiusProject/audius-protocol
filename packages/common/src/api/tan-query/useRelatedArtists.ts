import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useTypedQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'
import { primeUserData } from './utils/primeUserData'
const DEFAULT_PAGE_SIZE = 20

export type UseRelatedArtistsArgs = {
  artistId: ID | null | undefined
  pageSize?: number
  filterFollowed?: boolean
}

export const getRelatedArtistsQueryKey = ({
  artistId,
  pageSize = DEFAULT_PAGE_SIZE,
  filterFollowed
}: UseRelatedArtistsArgs) => [
  QUERY_KEYS.relatedArtists,
  artistId,
  { pageSize, filterFollowed }
]

export const useRelatedArtists = (
  {
    artistId,
    pageSize = DEFAULT_PAGE_SIZE,
    filterFollowed
  }: UseRelatedArtistsArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: getRelatedArtistsQueryKey({ artistId, pageSize, filterFollowed }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getRelatedUsers({
        id: Id.parse(artistId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId),
        filterFollowed
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!artistId
  })
}

export const useRelatedArtistsUsers = (
  args: UseRelatedArtistsArgs,
  options?: QueryOptions
) => {
  const { data: userIds } = useRelatedArtists(args, options)
  return useUsers(userIds)
}
