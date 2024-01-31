import {
  ID,
  FeedFilter,
  TimeRange,
  LineupState,
  Track,
  Collection,
  LineupTrack
} from '../../../models'

export type FeedPageState = {
  suggestedFollows: ID[]
  feed: LineupState<LineupTrack>
  trendingWeek: LineupState<Track | Collection>
  trendingMonth: LineupState<Track | Collection>
  trendingAllTime: LineupState<Track | Collection>
  feedFilter: FeedFilter
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
