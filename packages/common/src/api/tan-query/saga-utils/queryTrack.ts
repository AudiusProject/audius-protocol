import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'

import { TQTrack } from '../models'
import { QUERY_KEYS } from '../queryKeys'
import { getTrackQueryKey } from '../useTrack'

export function* queryTrack(id: ID | null | undefined) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData(getTrackQueryKey(id))
}

export function* queryTracks(ids: ID[]) {
  const queryClient = yield* getContext('queryClient')
  return ids.reduce(
    (acc, id) => {
      const track = queryClient.getQueryData(getTrackQueryKey(id))
      if (track) {
        acc[id] = track
      }
      return acc
    },
    {} as Record<ID, TQTrack>
  )
}

export function* queryAllTracks() {
  const queryClient = yield* getContext('queryClient')
  const queries = queryClient.getQueriesData<TQTrack>({
    queryKey: [QUERY_KEYS.track]
  })
  return queries.reduce(
    (acc, [_key, track]) => {
      if (track?.track_id) {
        acc[track.track_id] = track
      }
      return acc
    },
    {} as Record<ID, TQTrack>
  )
}
