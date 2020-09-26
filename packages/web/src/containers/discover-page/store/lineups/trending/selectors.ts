import { LineupStateTrack } from 'models/common/Lineup'
import TimeRange from 'models/TimeRange'
import { AppState } from 'store/types'

export const getTrendingEntries = (timeRange: TimeRange) => (
  state: AppState
): LineupStateTrack<{ id: number }>[] => {
  if (timeRange === TimeRange.WEEK) {
    return state.discover.trendingWeek.entries
  } else if (timeRange === TimeRange.MONTH) {
    return state.discover.trendingMonth.entries
  } else {
    return state.discover.trendingYear.entries
  }
}
