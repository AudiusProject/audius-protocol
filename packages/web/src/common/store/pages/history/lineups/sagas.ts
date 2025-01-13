import {
  trackActivityFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Kind, LineupEntry, Track } from '@audius/common/models'
import {
  accountSelectors,
  getContext,
  historyPageTracksLineupActions as tracksActions
} from '@audius/common/store'
import { full, HashId, Id } from '@audius/sdk'
import { keyBy } from 'lodash'
import { call, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getUserId } = accountSelectors
const { prefix: PREFIX } = tracksActions

function* getHistoryTracks() {
  yield* waitForRead()

  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  try {
    const currentUserId = yield* select(getUserId)
    if (!currentUserId) return []
    const hashedId = Id.parse(currentUserId)

    const activity = yield* call(
      [sdk.full.users, sdk.full.users.getUsersTrackHistory],
      {
        id: hashedId,
        limit: 100
      }
    )
    const activityData = activity.data
    if (!activityData) return []

    const tracks = transformAndCleanList(
      activityData,
      (activity: full.ActivityFull) => trackActivityFromSDK(activity)?.item
    )

    const processedTracks = yield* call(processAndCacheTracks, tracks)
    const processedTracksMap = keyBy(processedTracks, 'track_id')

    const lineupTracks: Track[] = []
    activityData.forEach((activity) => {
      const trackMetadata = activity.item
        ? processedTracksMap[HashId.parse(activity.item.id)!]
        : null
      // Prevent history for invalid tracks from getting into the lineup.
      if (trackMetadata && !trackMetadata.is_unlisted) {
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
  kind: entry.kind ?? ('track_id' in entry ? Kind.TRACKS : Kind.COLLECTIONS),
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
