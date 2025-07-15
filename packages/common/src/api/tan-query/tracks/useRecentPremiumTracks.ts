import { HashId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseRecentPremiumTracksArgs = {
  userId: ID | null | undefined
}

export const getRecentPremiumTracksQueryKey = ({
  userId
}: UseRecentPremiumTracksArgs) => {
  return [QUERY_KEYS.recentPremiumTracks, userId] as unknown as QueryKey<ID[]>
}

export const useRecentPremiumTracks = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getRecentPremiumTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getRecentPremiumTracks({
        limit: 30
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
