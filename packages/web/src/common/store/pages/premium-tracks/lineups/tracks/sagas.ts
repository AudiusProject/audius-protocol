import { Track } from '@audius/common/models'
import {
  premiumTracksPageLineupSelectors,
  premiumTracksPageLineupActions
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

const { getLineup } = premiumTracksPageLineupSelectors

class PremiumTracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      premiumTracksPageLineupActions.prefix,
      premiumTracksPageLineupActions,
      getLineup,
      ({ payload }) => payload?.tracks,
      undefined,
      true,
      undefined
    )
  }
}

export default function sagas() {
  return new PremiumTracksSagas().getSagas()
}
