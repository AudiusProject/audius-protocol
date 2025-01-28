import { Track } from '@audius/common/models'
import {
  remixesPageLineupActions as tracksActions,
  remixesPageSelectors,
  CommonState
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'
const { getTrackId, getLineup } = remixesPageSelectors

function* getTracks({ payload }: { payload?: { tracks: Track[] } }) {
  return payload?.tracks ?? []
}

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getTrackId(state)}`

class TracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      tracksActions.prefix,
      tracksActions,
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
