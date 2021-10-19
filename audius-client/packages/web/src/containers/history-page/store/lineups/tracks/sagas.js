import { keyBy } from 'lodash'
import { call } from 'redux-saga/effects'

import Kind from 'common/models/Kind'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import {
  PREFIX,
  tracksActions
} from 'containers/history-page/store/lineups/tracks/actions'
import AudiusBackend from 'services/AudiusBackend'
import { LineupSagas } from 'store/lineup/sagas'

function* getHistoryTracks() {
  try {
    const listenHistory = yield call(AudiusBackend.getListenHistoryTracks)
    const uniqueTrackIds = [
      ...new Set(listenHistory.tracks.map(t => t.trackId))
    ]
    const tracks = yield call(AudiusBackend.getAllTracks, {
      offset: 0,
      limit: uniqueTrackIds.length,
      idsArray: uniqueTrackIds
    })
    const processedTracks = yield call(processAndCacheTracks, tracks)
    const processedTracksMap = keyBy(processedTracks, 'track_id')

    const lineupTracks = []
    listenHistory.tracks.forEach((track, i) => {
      const trackMetadata = processedTracksMap[track.trackId]
      // Prevent history for invalid tracks from getting into the lineup.
      if (trackMetadata) {
        lineupTracks.push({
          ...trackMetadata,
          dateListened: track.listenDate
        })
      }
    })
    return lineupTracks
  } catch (e) {
    console.error(e)
    return []
  }
}

const keepTrackIdAndDateListened = entry => ({
  uid: entry.uid,
  kind: entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS,
  id: entry.track_id || entry.playlist_id,
  dateListened: entry.dateListened
})

const sourceSelector = () => PREFIX

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      store => store.history.tracks,
      getHistoryTracks,
      keepTrackIdAndDateListened,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
