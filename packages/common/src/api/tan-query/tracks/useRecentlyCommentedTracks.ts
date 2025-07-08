import { HashId, Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseRecentlyCommentedTracksArgs = {
  userId: ID | null | undefined
}

export const getRecentlyCommentedTracksQueryKey = ({
  userId
}: UseRecentlyCommentedTracksArgs) => {
  return [QUERY_KEYS.recentlyCommentedTracks, userId] as unknown as QueryKey<
    ID[]
  >
}

export const useRecentlyCommentedTracks = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getRecentlyCommentedTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getTracksWithRecentComments({
        userId: currentUserId ? Id.parse(currentUserId) : undefined,
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
