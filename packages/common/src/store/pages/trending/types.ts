import { ID, LineupState, TimeRange } from '../../../models'

export type TrendingPageState = {
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingAllTime: LineupState<{ id: ID }>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
