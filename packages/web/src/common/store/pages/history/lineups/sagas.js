import {
  accountSelectors,
  historyPageTracksLineupActions as tracksActions
} from '@audius/common'
import { Kind } from '@audius/common/models'
import { keyBy } from 'lodash'
import { call, getContext, select } from 'redux-saga/effects'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getUserId } = accountSelectors
const { prefix: PREFIX } = tracksActions

function* getHistoryTracks() {
  yield waitForRead()

  const apiClient = yield getContext('apiClient')
  try {
    const currentUserId = yield select(getUserId)
    const activity = yield apiClient.getUserTrackHistory({
      currentUserId,
      userId: currentUserId,
      limit: 100
    })

    const processedTracks = yield call(
      processAndCacheTracks,
      activity.map((a) => a.track)
    )
    const processedTracksMap = keyBy(processedTracks, 'track_id')

    const lineupTracks = []
    activity.forEach((activity, i) => {
      const trackMetadata = processedTracksMap[activity.track.track_id]
      // Prevent history for invalid tracks from getting into the lineup.
      if (trackMetadata) {
        lineupTracks.push({
          ...trackMetadata,
          dateListened: activity.timestamp
        })
      }
    })
    return lineupTracks
  } catch (e) {
    console.error(e)
    return []
  }
}

const keepTrackIdAndDateListened = (entry) => ({
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
      // store => store.history.tracks,
      (store) => store.pages.historyPage.tracks,
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
