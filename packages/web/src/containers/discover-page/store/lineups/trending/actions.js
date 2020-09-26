import { LineupActions } from 'store/lineup/actions'

export const PREFIX = 'DISCOVER_TRENDING'
export const TRENDING_WEEK_PREFIX = 'DISCOVER_TRENDING_WEEK'
export const TRENDING_MONTH_PREFIX = 'DISCOVER_TRENDING_MONTH'
export const TRENDING_YEAR_PREFIX = 'DISCOVER_TRENDING_YEAR'

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
class TrendingYearActions extends LineupActions {
  constructor() {
    super(TRENDING_YEAR_PREFIX)
  }
}

export const trendingActions = new TrendingActions()
export const trendingWeekActions = new TrendingWeekActions()
export const trendingMonthActions = new TrendingMonthActions()
export const trendingYearActions = new TrendingYearActions()
