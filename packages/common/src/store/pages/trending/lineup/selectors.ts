import { CommonState } from 'store/commonStore'

import { LineupEntry, TimeRange } from '../../../../models'

export const getTrendingEntries =
  (timeRange: TimeRange) =>
  (state: CommonState): LineupEntry<{ id: number }>[] => {
    if (timeRange === TimeRange.WEEK) {
      return state.pages.trending.trendingWeek.entries
    } else if (timeRange === TimeRange.MONTH) {
      return state.pages.trending.trendingMonth.entries
    } else {
      return state.pages.trending.trendingAllTime.entries
    }
  }
