import { LineupEntry, Track, UserTrackMetadata } from '@audius/common/models'
import {
  accountSelectors,
  getContext,
  historyPageTracksLineupActions as tracksActions
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { keyBy } from 'lodash'
import { call, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getUserId } = accountSelectors
const { prefix: PREFIX } = tracksActions

function* getHistoryTracks() {
  yield* waitForRead()

  const apiClient = yield* getContext('apiClient')
  try {
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) return []

    const activity = yield* call(apiClient.getUserTrackHistory, {
      currentUserId,
      userId: currentUserId,
      limit: 100
    })

    const activityTracks: UserTrackMetadata[] = activity
      .map((a) => a.track)
      .filter(removeNullable)

    const processedTracks = yield* call(processAndCacheTracks, activityTracks)
    const processedTracksMap = keyBy(processedTracks, 'track_id')

    const lineupTracks: Track[] = []
    activity.forEach((activity) => {
      const trackMetadata = activity.track
        ? processedTracksMap[activity.track.track_id]
        : null
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

const keepTrackIdAndDateListened = (entry: LineupEntry<Track>) => ({
  uid: entry.uid,
  kind: entry.kind,
  id: entry.track_id,
  dateListened: entry.dateListened
})

const sourceSelector = () => PREFIX

class TracksSagas extends LineupSagas<Track> {
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
