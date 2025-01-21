import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeUserData } from './utils/primeUserData'

const ARTISTS_PER_GENRE_PAGE_SIZE = 15

type UseTopArtistsInGenreArgs = {
  genre: string
  pageSize?: number
}

export const useTopArtistsInGenre = (
  args: UseTopArtistsInGenreArgs,
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { genre, pageSize = ARTISTS_PER_GENRE_PAGE_SIZE } = args

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.topArtistsInGenre, genre, pageSize],
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getTopUsersInGenre({
        genre: [genre],
        limit: pageSize,
        offset: (pageParam as number) * pageSize
      })
      const users = transformAndCleanList(data, userMetadataFromSDK)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    select: (data) => data.pages.flat(),
    ...config
  })
}
