import { LineupActions } from '../../../lineup/actions'

export const PREFIX = 'DISCOVER_TRENDING'
export const TRENDING_WEEK_PREFIX = 'DISCOVER_TRENDING_WEEK'
export const TRENDING_MONTH_PREFIX = 'DISCOVER_TRENDING_MONTH'
export const TRENDING_ALL_TIME_PREFIX = 'DISCOVER_TRENDING_ALL_TIME'

export const SET_TRENDING_SCORES = 'SET_TRENDING_SCORES'

class TrendingActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

class TrendingWeekActions extends LineupActions {
  constructor() {
    super(TRENDING_WEEK_PREFIX)
  }
}

class TrendingMonthActions extends LineupActions {
  constructor() {
    super(TRENDING_MONTH_PREFIX)
  }
}

class TrendingAllTimeActions extends LineupActions {
  constructor() {
    super(TRENDING_ALL_TIME_PREFIX)
  }
}

export const trendingActions = new TrendingActions()
export const trendingWeekActions = new TrendingWeekActions()
export const trendingMonthActions = new TrendingMonthActions()
export const trendingAllTimeActions = new TrendingAllTimeActions()
