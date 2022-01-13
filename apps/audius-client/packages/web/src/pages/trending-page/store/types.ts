import { ID } from 'common/models/Identifiers'
import TimeRange from 'common/models/TimeRange'
import { LineupState } from 'models/common/Lineup'

export default interface TrendingPageState {
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingYear: LineupState<{ id: ID }>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
