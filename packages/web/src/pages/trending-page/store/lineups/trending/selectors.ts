import TimeRange from 'common/models/TimeRange'
import { LineupStateTrack } from 'models/common/Lineup'
import { AppState } from 'store/types'

export const getTrendingEntries = (timeRange: TimeRange) => (
  state: AppState
): LineupStateTrack<{ id: number }>[] => {
  if (timeRange === TimeRange.WEEK) {
    return state.trending.trendingWeek.entries
  } else if (timeRange === TimeRange.MONTH) {
    return state.trending.trendingMonth.entries
  } else {
    return state.trending.trendingYear.entries
  }
}
