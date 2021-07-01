import TimeRange from 'models/TimeRange'
import { ID } from 'models/common/Identifiers'
import { LineupState } from 'models/common/Lineup'

export default interface TrendingPageState {
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingYear: LineupState<{ id: ID }>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
