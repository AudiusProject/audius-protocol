import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pick } from 'lodash'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { TQTrack } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions, SelectableQueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useTrack } from './useTrack'
import { primeTrackData } from './utils/primeTrackData'

export const getTrackByPermalinkQueryKey = (
  permalink: string | undefined | null
) => {
  return [QUERY_KEYS.trackByPermalink, permalink] as unknown as QueryKey<ID>
}

export const useTrackByPermalink = <TResult = TQTrack>(
  permalink: string | undefined | null,
  options?: SelectableQueryOptions<TQTrack, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()

  const simpleOptions = pick(options, [
    'enabled',
    'staleTime',
    'placeholderData'
  ]) as QueryOptions

  const { data: trackId } = useQuery({
    queryKey: getTrackByPermalinkQueryKey(permalink),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.tracks.getBulkTracks({
        permalink: [permalink!],
        userId: OptionalId.parse(currentUserId)
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
    staleTime: simpleOptions?.staleTime ?? Infinity,
    enabled: simpleOptions?.enabled !== false && !!permalink
  })

  return useTrack(trackId, options)
}
