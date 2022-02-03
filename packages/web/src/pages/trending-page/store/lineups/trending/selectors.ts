import { LineupStateTrack } from 'common/models/Lineup'
import TimeRange from 'common/models/TimeRange'
import { AppState } from 'store/types'

export const getTrendingEntries = (timeRange: TimeRange) => (
  state: AppState
): LineupStateTrack<{ id: number }>[] => {
  if (timeRange === TimeRange.WEEK) {
    return state.trending.trendingWeek.entries
  } else if (timeRange === TimeRange.MONTH) {
    return state.trending.trendingMonth.entries
  } else {
    return state.trending.trendingAllTime.entries
  }
}
