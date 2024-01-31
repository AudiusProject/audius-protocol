import { LineupState, TimeRange, Track } from '../../../models'

export type TrendingPageState = {
  trendingWeek: LineupState<Track>
  trendingMonth: LineupState<Track>
  trendingAllTime: LineupState<Track>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
