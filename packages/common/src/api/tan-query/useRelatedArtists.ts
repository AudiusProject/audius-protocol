import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { MAX_PROFILE_RELATED_ARTISTS } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseRelatedArtistsArgs = {
  artistId: ID | null | undefined
  limit?: number
  filterFollowed?: boolean
}

export const useRelatedArtists = (
  {
    artistId,
    limit = MAX_PROFILE_RELATED_ARTISTS,
    filterFollowed
  }: UseRelatedArtistsArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.relatedArtists, artistId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getRelatedUsers({
        id: Id.parse(artistId),
        limit,
        userId: OptionalId.parse(currentUserId),
        filterFollowed
      })

      const users = transformAndCleanList(data, userMetadataFromSDK)

      // Prime the users data in both React Query and Redux
      if (users.length) {
        primeUserData({ users, queryClient, dispatch })
      }

      return users
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!artistId
  })
}
