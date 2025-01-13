import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { primeUserData } from './utils/primeUserData'

const ARTISTS_PER_GENRE_LIMIT = 15

type UseTopArtistsInGenreArgs = {
  genre: string
  limit?: number
}

export const useTopArtistsInGenre = (
  args: UseTopArtistsInGenreArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { genre, limit = ARTISTS_PER_GENRE_LIMIT } = args

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.topArtistsInGenre, genre, limit],
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getTopUsersInGenre({
        genre: [genre],
        limit,
        offset: (pageParam as number) * limit
      })
      const users = transformAndCleanList(data, userMetadataFromSDK)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined
      return allPages.length
    },
    select: (data) => data.pages.flat(),
    ...config
  })
}
