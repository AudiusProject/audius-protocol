import { Id, TrackCommentNotificationResponse } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { Nullable } from '~/utils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey } from '../types'

export const getTrackCommentNotificationSettingQueryKey = (trackId: ID) => {
  return [
    QUERY_KEYS.trackCommentNotificationSetting,
    trackId
  ] as unknown as QueryKey<TrackCommentNotificationResponse>
}

export const useGetTrackCommentNotificationSetting = (
  trackId: ID,
  currentUserId: Nullable<ID>
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getTrackCommentNotificationSettingQueryKey(trackId),
    queryFn: async () => {
      if (!currentUserId) return null
      const sdk = await audiusSdk()
      return await sdk.tracks.getTrackCommentNotificationSetting({
        trackId: Id.parse(trackId),
        userId: Id.parse(currentUserId)
      })
    }
  })
}
