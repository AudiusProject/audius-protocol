import { LineupActions } from 'store/lineup/actions'

export const PREFIX = 'TRENDING_UNDERGROUND'

class TrendingUndergroundLineupActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const trendingUndergroundLineupActions = new TrendingUndergroundLineupActions()
