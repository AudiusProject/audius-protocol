import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataFromSDK } from '~/adapters'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { MAX_PROFILE_RELATED_ARTISTS } from '~/utils'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type Config = {
  limit?: number
  staleTime?: number
  enabled?: boolean
  filterFollowed?: boolean
}

export const useRelatedArtists = (artistId?: ID | null, config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [QUERY_KEYS.relatedArtists, artistId],
    queryFn: async () => {
      if (!artistId) {
        return []
      }
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getRelatedUsers({
        id: Id.parse(artistId),
        limit: config?.limit ?? MAX_PROFILE_RELATED_ARTISTS,
        userId: OptionalId.parse(currentUserId),
        filterFollowed: config?.filterFollowed
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
