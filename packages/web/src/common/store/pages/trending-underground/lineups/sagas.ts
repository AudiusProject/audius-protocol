import { Track } from '@audius/common/models'
import {
  trendingUndergroundPageLineupSelectors,
  trendingUndergroundPageLineupActions
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

const { getLineup } = trendingUndergroundPageLineupSelectors

function* getTrendingUnderground({
  payload
}: {
  payload?: {
    tracks: Track[]
  }
}) {
  return payload?.tracks ?? []
}

class UndergroundTrendingSagas extends LineupSagas<Track> {
  constructor() {
    super(
      trendingUndergroundPageLineupActions.prefix,
      trendingUndergroundPageLineupActions,
      getLineup,
      getTrendingUnderground,
      undefined,
      undefined,
      undefined
    )
  }
}

const sagas = () => new UndergroundTrendingSagas().getSagas()
export default sagas
