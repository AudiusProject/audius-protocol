import FeedFilter from 'models/FeedFilter'
import TimeRange from 'models/TimeRange'
import { ID } from 'models/common/Identifiers'
import { LineupState } from 'models/common/Lineup'

export default interface DiscoveryPageState {
  suggestedFollows: ID[]
  feed: LineupState<{ id: ID; activityTimestamp: number }>
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingYear: LineupState<{ id: ID }>
  feedFilter: FeedFilter
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
