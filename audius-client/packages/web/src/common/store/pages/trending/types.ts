import { ID } from '@audius/common'

import { LineupState } from 'common/models/Lineup'
import TimeRange from 'common/models/TimeRange'

export type TrendingPageState = {
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingAllTime: LineupState<{ id: ID }>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}
