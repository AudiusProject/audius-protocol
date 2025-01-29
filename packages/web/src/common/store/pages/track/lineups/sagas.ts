import { Track, UserTrackMetadata } from '@audius/common/models'
import {
  trackPageLineupActions,
  trackPageSelectors
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'
const { PREFIX, tracksActions } = trackPageLineupActions
const { getLineup, getSourceSelector: sourceSelector } = trackPageSelectors

function* getTracks({
  payload
}: {
  payload?: { tracks: UserTrackMetadata[] }
}) {
  return payload?.tracks ?? []
}

class TracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      // @ts-ignore type is wrongly inferred as LineupState<{ id: number }>
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
