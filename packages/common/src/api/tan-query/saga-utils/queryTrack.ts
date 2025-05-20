import { call, select, all } from 'typed-redux-saga'

import { Track } from '~/models'
import { ID } from '~/models/Identifiers'
import { getUserId } from '~/store/account/selectors'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'
import { removeNullable, Uid } from '~/utils'

import { TQTrack } from '../models'
import { QUERY_KEYS } from '../queryKeys'
import { getTrackQueryFn, getTrackQueryKey } from '../tracks/useTrack'

export function* queryTrack(id: ID | null | undefined, forceRetrieve = false) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)
  const dispatch = yield* getContext('dispatch')

  const queryData = yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getTrackQueryKey(id),
    queryFn: async () =>
      getTrackQueryFn(id!, currentUserId, queryClient, sdk, dispatch),
    staleTime: forceRetrieve ? 0 : undefined
  })

  return queryData as TQTrack | undefined
}

export function* queryTracks(
  ids: ID[],
  forceRetrieve = false
): Generator<any, Track[], any> {
  if (!ids.length) return [] as Track[]

  // Query each track in parallel using queryTrack
  const tracks = yield* all(
    ids.map((id) => call(queryTrack, id, forceRetrieve))
  )

  // Filter out null and undefined results and return as Track[]
  return tracks.filter(removeNullable)
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

export function* queryTrackByUid(
  uid: string | null | undefined,
  forceRetrieve = false
) {
  if (!uid) return null
  const trackId = Number(Uid.fromString(uid).id)
  return yield* queryTrack(trackId, forceRetrieve)
}
