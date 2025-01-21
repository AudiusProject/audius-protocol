import {
  Kind,
  LineupEntry,
  Track,
  UserTrackMetadata
} from '@audius/common/models'
import { historyPageTracksLineupActions as tracksActions } from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'
const { prefix: PREFIX } = tracksActions

function* getHistoryTracks({
  payload
}: {
  payload?: { tracks: UserTrackMetadata[] }
}) {
  return payload?.tracks ?? []
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
