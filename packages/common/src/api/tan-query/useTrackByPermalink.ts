import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { getUserId } from '~/store/account/selectors'

import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useTrack } from './useTrack'
import { primeTrackData } from './utils/primeTrackData'

export const getTrackByPermalinkQueryKey = (
  permalink: string | undefined | null
) => [QUERY_KEYS.trackByPermalink, permalink]

export const useTrackByPermalink = <TResult = TQTrack>(
  permalink: string | undefined | null,
  options?: QueryOptions<TQTrack, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  const { data: trackId } = useQuery({
    queryKey: getTrackByPermalinkQueryKey(permalink),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getBulkTracks({
        permalink: [permalink!],
        userId: Id.parse(currentUserId)
      })

      if (data.length === 0) {
        return null
      }

      const track = userTrackMetadataFromSDK(data[0])

      if (track) {
        primeTrackData({ tracks: [track], queryClient, dispatch })
      }

      return track?.track_id
    },
    staleTime: (options as any)?.staleTime ?? Infinity,
    enabled: options?.enabled !== false && !!permalink
  })

  return useTrack(trackId, options)
}
