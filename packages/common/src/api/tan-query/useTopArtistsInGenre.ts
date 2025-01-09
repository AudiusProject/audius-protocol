import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  offset?: number
}

export const useTopArtistsInGenre = (
  args: UseTopArtistsInGenreArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { genre, limit = ARTISTS_PER_GENRE_LIMIT, offset } = args

  return useQuery({
    queryKey: [QUERY_KEYS.topArtistsInGenre, genre, limit, offset],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getTopUsersInGenre({
        genre: [genre],
        limit,
        offset
      })
      const users = transformAndCleanList(data, userMetadataFromSDK)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false
  })
}
