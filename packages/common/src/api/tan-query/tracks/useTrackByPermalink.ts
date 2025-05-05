import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pick } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Status } from '~/models/Status'
import { getAccountStatus } from '~/store/account/selectors'

import { TQTrack } from '../models'
import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { primeTrackData } from '../utils/primeTrackData'

import { useTrack } from './useTrack'

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
  const accountStatus = useSelector(getAccountStatus)

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
    enabled:
      simpleOptions?.enabled !== false &&
      !!permalink &&
      // Need to wait for account status to load so that we're able to query with the correct user id
      (accountStatus === Status.SUCCESS || accountStatus === Status.ERROR)
  })

  return useTrack(trackId, options)
}
