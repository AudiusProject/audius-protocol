import { QueryClient } from '@tanstack/react-query'
import { mergeWith } from 'lodash'
import { getContext } from 'typed-redux-saga'

import { ID, Track } from '~/models'
import { mergeCustomizer } from '~/store/cache/mergeCustomizer'

import { getTrackQueryKey } from '../tracks/useTrack'

import { primeTrackData } from './primeTrackData'

type PartialTrackUpdate = Partial<Track> & { track_id: ID }

/**
 * Updates tracks with partial data, merging with existing track data
 * and updating both react-query and redux stores.
 * Gets queryClient and dispatch from context automatically.
 *
 * @example
 * // Update a single track
 * yield* updateTrackData([{ track_id: '123', _is_publishing: true }])
 *
 * // Update multiple tracks
 * yield* updateTrackData([
 *   { track_id: '123', _is_publishing: true },
 *   { track_id: '456', _marked_deleted: true }
 * ])
 */
export const updateTrackData = function* (partialTracks: PartialTrackUpdate[]) {
  const queryClient = yield* getContext<QueryClient>('queryClient')

  // Get existing track data and merge with updates
  const tracksToUpdate = partialTracks.map((partialTrack) => {
    const { track_id } = partialTrack
    const existingTrack = queryClient.getQueryData(
      getTrackQueryKey(track_id)
    ) as Track | undefined

    if (existingTrack) {
      return mergeWith({}, existingTrack, partialTrack, mergeCustomizer)
    }
    return partialTrack as Track
  })

  // Use primeTrackData with forceReplace to ensure updates are saved
  primeTrackData({
    tracks: tracksToUpdate,
    queryClient,
    forceReplace: true
  })
}
