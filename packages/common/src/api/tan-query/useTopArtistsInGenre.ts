import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useUsers } from './useUsers'
import { primeUserData } from './utils/primeUserData'

const ARTISTS_PER_GENRE_PAGE_SIZE = 15

type UseTopArtistsInGenreArgs = {
  genre: string
  pageSize?: number
}

export const getTopArtistsInGenreQueryKey = (
  genre: string,
  pageSize: number
) => [QUERY_KEYS.topArtistsInGenre, genre, pageSize]

export const useTopArtistsInGenre = (
  args: UseTopArtistsInGenreArgs,
  options?: Omit<QueryOptions<any>, 'select'>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { genre, pageSize = ARTISTS_PER_GENRE_PAGE_SIZE } = args

  const { data: userIds, ...queryResult } = useInfiniteQuery<
    number[],
    Error,
    number[]
  >({
    queryKey: getTopArtistsInGenreQueryKey(genre, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage: number[], allPages: number[][]) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getTopUsersInGenre({
        genre: [genre],
        limit: pageSize,
        offset: (pageParam as number) * pageSize
      })
      const users = transformAndCleanList(data, userMetadataFromSDK)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    select: (data) => data.pages.flat(),
    ...(options as any),
    enabled: options?.enabled !== false && !!genre
  })

  const { data: users } = useUsers(userIds, {
    ...options,
    enabled: options?.enabled !== false && !!userIds
  })

  return {
    data: users,
    ...queryResult
  }
}
