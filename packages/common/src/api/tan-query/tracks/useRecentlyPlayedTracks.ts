import { HashId, Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { primeTrackData, useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseRecentlyPlayedTracksArgs = {
  userId: ID | null | undefined
}

export const getRecentlyPlayedTracksQueryKey = ({
  userId
}: UseRecentlyPlayedTracksArgs) => {
  return [QUERY_KEYS.recentlyPlayedTracks, userId] as unknown as QueryKey<ID[]>
}

export const useRecentlyPlayedTracks = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getRecentlyPlayedTracksQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      console.log('asdf currentUserId', currentUserId)
      const { data = [] } = await sdk.full.users.getUsersTrackHistory({
        id: Id.parse(currentUserId),
        limit: 30
      })
      const tracks = transformAndCleanList(
        data.map((trackActivity) => trackActivity.item),
        userTrackMetadataFromSDK
      )

      primeTrackData({
        tracks,
        queryClient
      })

      return data.map((trackActivity) => HashId.parse(trackActivity.item.id))
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
