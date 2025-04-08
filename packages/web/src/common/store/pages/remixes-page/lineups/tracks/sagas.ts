import { Track } from '@audius/common/models'
import {
  remixesPageLineupActions as tracksActions,
  remixesPageSelectors,
  CommonState
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

const { getTrackId, getLineup } = remixesPageSelectors

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getTrackId(state)}`

class TracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      tracksActions.prefix,
      tracksActions,
      getLineup,
      ({ payload }) => payload.items,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
