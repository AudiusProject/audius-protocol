import { call, put, select } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import { makeGetTrendingOrder, makeGetTrendingStats } from './selectors'
import {
  setLastFetchedTrendingGenre,
  setLastFetchedTimeRange
} from 'containers/discover-page/store/actions'
import { LineupSagas } from 'store/lineup/sagas'
import TimeRange from 'models/TimeRange'

import { getTrendingScore, sortByTrendingScore } from 'utils/trendingScorer'

import {
  getTrendingGenre,
  getLastFetchedTrendingGenre
} from 'containers/discover-page/store/selectors'

import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_YEAR_PREFIX,
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions
} from './actions'
import { retrieveTracks } from 'store/cache/tracks/utils'

const getActionSet = timeRange => {
  return {
    [TimeRange.WEEK]: trendingWeekActions,
    [TimeRange.MONTH]: trendingMonthActions,
    [TimeRange.YEAR]: trendingYearActions
  }[timeRange]
}

function* getTrendingOrderAndStats(timeRange, genre) {
  const trendingResponse = yield call(AudiusBackend.getTrendingTracks, {
    offset: 0,
    limit: 200,
    timeRange,
    genre: genre
  })
  const trendingOrder = trendingResponse.listen_counts
    .sort(sortByTrendingScore(timeRange))
    .map(t => t.track_id)
  const trendingStats = trendingResponse.listen_counts.reduce((stats, t) => {
    stats[t.track_id] = {
      ...t,
      score: getTrendingScore(t, timeRange)
    }
    return stats
  }, {})
  return { trendingOrder, trendingStats }
}

// This will return true if it stored the response, false if the genre changed and it didn't store.
function* fetchTrendingScores(timeRange, genreAtStart) {
  const { trendingOrder, trendingStats } = yield call(
    getTrendingOrderAndStats,
    timeRange,
    genreAtStart
  )

  const actionSet = getActionSet(timeRange)
  const genreAtEnd = yield select(getTrendingGenre)
  if (genreAtStart !== genreAtEnd) return false

  yield put(actionSet.setTrendingScores(trendingOrder, trendingStats))
  return true
}

// Injects a timeRange provider function getTracks. Allows us to
// specialize a getTracks function for different lineup sagas.
function makeGetTracks(timeRangeProvider) {
  return function* ({ offset, limit }) {
    return yield getTracks({ timeRangeProvider, offset, limit })
  }
}

function* getTracks({ timeRangeProvider, offset, limit }) {
  const timeRange = yield timeRangeProvider()
  const [getTrendingOrder, getTrendingStats] = [
    makeGetTrendingOrder(timeRange),
    makeGetTrendingStats(timeRange)
  ]

  // Refetch when the last fetched genre isn't the one being requested
  const genreAtStart = yield select(getTrendingGenre)
  const lastGenre = yield select(getLastFetchedTrendingGenre)

  let trendingStats = yield select(getTrendingStats)
  let trendingOrder = yield select(getTrendingOrder)

  const needsNewScores =
    !Object.keys(trendingStats).length ||
    !trendingOrder.length ||
    genreAtStart !== lastGenre

  if (needsNewScores) {
    const didFetch = yield call(fetchTrendingScores, timeRange, genreAtStart)
    if (!didFetch) return null

    trendingStats = yield select(getTrendingStats)
    trendingOrder = yield select(getTrendingOrder)
  }

  let ret
  if (trendingOrder.length > 0) {
    const trackIds = yield call(retrieveTracks, {
      trackIds: trendingOrder.slice(offset, offset + limit)
    })

    // If we've changed genres since we kicked off this call, we shouldn't
    // save the trackIds.
    const genreAtEnd = yield select(getTrendingGenre)
    if (genreAtStart !== genreAtEnd) {
      return null
    }

    ret = trackIds
  } else {
    ret = []
  }

  yield put(setLastFetchedTrendingGenre(genreAtStart))
  yield put(setLastFetchedTimeRange(timeRange))
  return ret
}

class TrendingWeekSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_WEEK_PREFIX,
      trendingWeekActions,
      store => store.discover.trendingWeek,
      makeGetTracks(function* () {
        return yield TimeRange.WEEK
      })
    )
  }
}

class TrendingMonthSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      store => store.discover.trendingMonth,
      makeGetTracks(function* () {
        return yield TimeRange.MONTH
      })
    )
  }
}

class TrendingYearSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_YEAR_PREFIX,
      trendingYearActions,
      store => store.discover.trendingYear,
      makeGetTracks(function* () {
        return yield TimeRange.YEAR
      })
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
