import { LineupActions } from '../../../lineup/actions'

export const PREFIX = 'TRENDING_UNDERGROUND'

class TrendingUndergroundPageLineupActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const trendingUndergroundPageLineupActions =
  new TrendingUndergroundPageLineupActions()
