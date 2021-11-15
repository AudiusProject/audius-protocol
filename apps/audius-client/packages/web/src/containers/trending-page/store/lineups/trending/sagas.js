import { select } from 'redux-saga/effects'

import TimeRange from 'common/models/TimeRange'
import { getUserId } from 'common/store/account/selectors'
import { retrieveTrending } from 'containers/track-page/store/retrieveTrending'
import { getTrendingGenre } from 'containers/trending-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'

import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_YEAR_PREFIX,
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions
} from './actions'

function getTracks(timeRange) {
  return function* ({ offset, limit }) {
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
      store => store.trending.trendingWeek,
      getTracks(TimeRange.WEEK)
    )
  }
}

class TrendingMonthSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      store => store.trending.trendingMonth,
      getTracks(TimeRange.MONTH)
    )
  }
}

class TrendingYearSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_YEAR_PREFIX,
      trendingYearActions,
      store => store.trending.trendingYear,
      getTracks(TimeRange.YEAR)
    )
  }
}

export default function sagas() {
  return [
    ...new TrendingWeekSagas().getSagas(),
    ...new TrendingMonthSagas().getSagas(),
    ...new TrendingYearSagas().getSagas()
  ]
}
