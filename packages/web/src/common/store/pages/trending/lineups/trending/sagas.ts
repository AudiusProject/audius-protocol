import { TimeRange, Track, Collection } from '@audius/common/models'
import {
  accountSelectors,
  trendingPageLineupActions,
  trendingPageSelectors
} from '@audius/common/store'
import { select } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { retrieveTrending } from './retrieveTrending'
const { getTrendingGenre } = trendingPageSelectors
const {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX,
  trendingWeekActions,
  trendingMonthActions,
  trendingAllTimeActions
} = trendingPageLineupActions
const getUserId = accountSelectors.getUserId

function getTracks(timeRange: TimeRange) {
  return function* ({ offset, limit }: { offset: number; limit: number }) {
    yield* waitForRead()
    const genreAtStart = yield* select(getTrendingGenre)
    const userId = yield* select(getUserId)
    try {
      const tracks = yield* retrieveTrending({
        timeRange,
        limit,
        offset,
        genre: genreAtStart,
        currentUserId: userId
      })
      return tracks
    } catch (e: any) {
      console.error(`Trending error: ${e.message}`)
      return []
    }
  }
}

class TrendingWeekSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_WEEK_PREFIX,
      trendingWeekActions,
      (store) => store.pages.trending.trendingWeek,
      getTracks(TimeRange.WEEK)
    )
  }
}

class TrendingMonthSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      (store) => store.pages.trending.trendingMonth,
      getTracks(TimeRange.MONTH)
    )
  }
}

class TrendingAllTimeSagas extends LineupSagas<Track | Collection> {
  constructor() {
    super(
      TRENDING_ALL_TIME_PREFIX,
      trendingAllTimeActions,
      (store) => store.pages.trending.trendingAllTime,
      getTracks(TimeRange.ALL_TIME)
    )
  }
}

export default function sagas() {
  return [
    ...new TrendingWeekSagas().getSagas(),
    ...new TrendingMonthSagas().getSagas(),
    ...new TrendingAllTimeSagas().getSagas()
  ]
}
