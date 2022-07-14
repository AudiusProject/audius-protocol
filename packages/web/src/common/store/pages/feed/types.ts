import { ID } from '@audius/common'

import FeedFilter from 'common/models/FeedFilter'
import { LineupState } from 'common/models/Lineup'
import TimeRange from 'common/models/TimeRange'

export type FeedPageState = {
  suggestedFollows: ID[]
  feed: LineupState<{ id: ID; activityTimestamp: number }>
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingAllTime: LineupState<{ id: ID }>
  feedFilter: FeedFilter
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
