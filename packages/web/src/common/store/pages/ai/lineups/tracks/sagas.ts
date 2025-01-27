import { Track } from '@audius/common/models'
import {
  aiPageLineupActions as tracksActions,
  aiPageSelectors,
  CommonState
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'
const { getLineup, getAiUserHandle } = aiPageSelectors

function* getTracks({ payload }: { payload?: { tracks: Track[] } }) {
  return payload?.tracks ?? []
}

const sourceSelector = (state: CommonState) =>
  `${tracksActions.prefix}:${getAiUserHandle(state)}`

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
