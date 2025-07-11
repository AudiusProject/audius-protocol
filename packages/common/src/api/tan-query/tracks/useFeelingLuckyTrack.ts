import { HashId, Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseFeelingLuckyTracksArgs = {
  userId: ID | null | undefined
  limit?: number
}

export const getFeelingLuckyTracksQueryKey = ({
  userId,
  limit
}: UseFeelingLuckyTracksArgs) => {
  return [QUERY_KEYS.feelingLuckyTracks, userId, limit] as unknown as QueryKey<
    ID[]
  >
}

export const useFeelingLuckyTracks = <TResult = ID[]>(
  args?: { limit?: number },
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const { limit } = args || {}

  return useQuery({
    queryKey: getFeelingLuckyTracksQueryKey({ userId: currentUserId, limit }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getFeelingLuckyTracks({
        userId: currentUserId ? Id.parse(currentUserId) : undefined,
        limit
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
