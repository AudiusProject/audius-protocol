import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { getTrackQueryKey } from './useTrack'
import { primeTrackData } from './utils/primeTrackData'

// If the user edits a stale track, the optimistic update fails
const STALE_TIME = Infinity

export const getTrackByPermalinkQueryKey = (
  permalink: string | undefined | null
) => [QUERY_KEYS.trackByPermalink, permalink]

export const useTrackByPermalink = (
  permalink: string | undefined | null,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  const isMutating = queryClient.isMutating({
    mutationKey: getTrackByPermalinkQueryKey(permalink)
  })

  return useQuery({
    queryKey: getTrackByPermalinkQueryKey(permalink),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getBulkTracks({
        permalink: [permalink!],
        userId: Id.parse(currentUserId)
      })

      const track = data[0] ? userTrackMetadataFromSDK(data[0]) : null

      if (track) {
        // Prime related entities
        primeTrackData({ tracks: [track], queryClient, dispatch })

        // Prime track cache
        queryClient.setQueryData(getTrackQueryKey(track.track_id), track)
      }

      return track
    },
    staleTime: options?.staleTime ?? STALE_TIME,
    enabled: options?.enabled !== false && !!permalink && !isMutating
  })
}
