import { call } from 'redux-saga/effects'
import { keyBy } from 'lodash'

import AudiusBackend from 'services/AudiusBackend'

import {
  PREFIX,
  moreByActions
} from 'containers/deleted-page/store/lineups/more-by/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getLineup } from 'containers/deleted-page/store/selectors'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { ID } from 'models/common/Identifiers'
import Track from 'models/Track'

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { userId: ID | null }
}) {
  const { userId } = payload
  const tracks = yield call(AudiusBackend.getArtistTracks, {
    offset,
    limit,
    userId,
    filterDeleted: true
  })
  const processed = yield call(processAndCacheTracks, tracks)

  const moreByArtistListenCounts = keyBy(
    yield call(
      AudiusBackend.getTrackListenCounts,
      processed.map((track: any) => track.track_id)
    ),
    'trackId'
  )

  return (
    processed
      // Add listen counts
      .map((t: Track, i: number) => ({
        ...t,
        _listen_count: moreByArtistListenCounts[t.track_id]
          ? moreByArtistListenCounts[t.track_id].listens
          : 0
      }))
      // Sort by listen count desc
      .sort((a: Track, b: Track) => b._listen_count! - a._listen_count!)
      // Take only the first 5
      .slice(0, 5)
  )
}

const sourceSelector = () => PREFIX

class MoreBySagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      moreByActions,
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new MoreBySagas().getSagas()
}
