import { HashId, Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseRecommendedTracksArgs = {
  userId: ID | null | undefined
}

export const getRecommendedTracksQueryKey = ({
  userId
}: UseRecommendedTracksArgs) => {
  return [QUERY_KEYS.recommendedTracks, userId] as unknown as QueryKey<ID[]>
}

export const useRecommendedTracks = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getRecommendedTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getUserRecommendedTracks({
        id: Id.parse(currentUserId),
        userId: Id.parse(currentUserId)
      })
      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      primeTrackData({
        tracks,
        queryClient
      })

      return data.map((item) => HashId.parse(item.id))
    },
    ...options,
    enabled: options?.enabled !== false
  })
}
