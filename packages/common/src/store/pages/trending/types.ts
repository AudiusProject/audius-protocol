import { Collection, LineupState, TimeRange, Track } from '../../../models'

export type TrendingPageState = {
  trendingWeek: LineupState<Track | Collection>
  trendingMonth: LineupState<Track | Collection>
  trendingAllTime: LineupState<Track | Collection>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
