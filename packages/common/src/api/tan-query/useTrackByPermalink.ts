import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { OptionalId } from '~/models'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { primeTrackData } from './utils/primeTrackData'

export const useTrackByPermalink = (
  permalink: string | undefined | null,
  options?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.trackByPermalink, permalink],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getBulkTracks({
        permalink: [permalink!],
        userId: OptionalId.parse(currentUserId)
      })

      const track = data[0] ? userTrackMetadataFromSDK(data[0]) : null

      if (track) {
        // Prime related entities
        primeTrackData({ track, queryClient, dispatch })

        // Prime track cache
        queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
      }

      return track
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!permalink
  })
}
