import { QueryClient } from '@tanstack/react-query'
import { mergeWith } from 'lodash'
import { AnyAction, Dispatch } from 'redux'
import { getContext } from 'typed-redux-saga'

import { ID, Kind, Track } from '~/models'
import { cacheActions } from '~/store/cache'
import { mergeCustomizer } from '~/store/cache/mergeCustomizer'

import { getTrackQueryKey } from '../tracks/useTrack'

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
  const dispatch = yield* getContext<Dispatch<AnyAction>>('dispatch')

  partialTracks.forEach((partialTrack) => {
    const { track_id } = partialTrack

    // Update react-query store
    queryClient.setQueryData(
      getTrackQueryKey(track_id),
      // TODO: drop the merge customizer once we're fully off of redux
      (prev) => prev && mergeWith(prev, partialTrack, mergeCustomizer)
    )
  })

  dispatch(
    cacheActions.update(
      Kind.TRACKS,
      partialTracks.map((partialTrack) => ({
        id: partialTrack.track_id,
        metadata: partialTrack
      }))
    )
  )
}
