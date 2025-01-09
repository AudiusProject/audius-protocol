import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAppContext } from '~/context/appContext'
import { OptionalId } from '~/models'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { primeTrackData } from './utils/primeTrackData'

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useTrackByPermalink = (
  permalink: string | undefined | null,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.trackByPermalink, permalink],
    queryFn: async () => {
      if (!permalink) return null
      const { data = [] } = await audiusSdk!.full.tracks.getBulkTracks({
        permalink: [permalink],
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
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!audiusSdk && !!permalink
  })
}
