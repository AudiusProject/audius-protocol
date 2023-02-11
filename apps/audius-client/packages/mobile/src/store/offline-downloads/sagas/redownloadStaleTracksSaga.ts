import moment from 'moment'
import { select } from 'typed-redux-saga'

import { getOfflineTrackMetadata } from '../selectors'
import type { OfflineItem } from '../slice'

const STALE_DURATION_TRACKS = moment.duration(1, 'second')
const STALE_BATCH_SIZE = 20

export function* redownloadStaleTracksSaga() {
  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)

  const staleTrackIds = Object.keys(offlineTrackMetadata)
    .slice(0, STALE_BATCH_SIZE)
    .map((id) => parseInt(id, 10))
    .filter((trackId) => {
      const metadata = offlineTrackMetadata[trackId]
      if (!metadata?.last_verified_time) return false
      return moment()
        .subtract(STALE_DURATION_TRACKS)
        .isAfter(metadata.last_verified_time)
    })

  const staleTracksToAdd: OfflineItem[] = staleTrackIds.map((id) => ({
    type: 'stale-track',
    id
  }))

  return staleTracksToAdd
}
