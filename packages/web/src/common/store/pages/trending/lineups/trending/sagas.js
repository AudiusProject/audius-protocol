import {
  accountSelectors,
  trendingPageLineupActions,
  trendingPageSelectors
} from '@audius/common'
import { TimeRange } from '@audius/common/models'
import { select } from 'redux-saga/effects'

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

function getTracks(timeRange) {
  return function* ({ offset, limit }) {
    yield waitForRead()
    const genreAtStart = yield select(getTrendingGenre)
    const userId = yield select(getUserId)
    try {
      const tracks = yield retrieveTrending({
        timeRange,
        limit,
        offset,
        genre: genreAtStart,
        currentUserId: userId
      })
      return tracks
    } catch (e) {
      console.error(`Trending error: ${e.message}`)
      return []
    }
  }
}

class TrendingWeekSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_WEEK_PREFIX,
      trendingWeekActions,
      (store) => store.pages.trending.trendingWeek,
      getTracks(TimeRange.WEEK)
    )
  }
}

class TrendingMonthSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      (store) => store.pages.trending.trendingMonth,
      getTracks(TimeRange.MONTH)
    )
  }
}

class TrendingAllTimeSagas extends LineupSagas {
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
