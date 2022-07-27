import { TimeRange } from '@audius/common'

import { asLineup } from 'common/store/lineup/reducer'
import {
  SET_TRENDING_GENRE,
  SET_TRENDING_TIME_RANGE,
  SET_LAST_FETCHED_TRENDING_GENRE
} from 'common/store/pages/trending/actions'
import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX
} from 'common/store/pages/trending/lineup/actions'
import { GENRES } from 'common/utils/genres'

import { trendingWeek, trendingMonth, trendingAllTime } from './lineup/reducer'

const urlParams = new URLSearchParams(window.location.search)
const genre = urlParams.get('genre')
const timeRange = urlParams.get('timeRange')

const initialState = {
  trendingTimeRange: Object.values(TimeRange).includes(timeRange)
    ? timeRange
    : TimeRange.WEEK,
  trendingGenre: Object.values(GENRES).includes(genre) ? genre : null,
  lastFetchedTrendingGenre: null
}

const actionsMap = {
  [SET_TRENDING_TIME_RANGE](state, action) {
    return {
      ...state,
      trendingTimeRange: action.timeRange
    }
  },
  [SET_TRENDING_GENRE](state, action) {
    return {
      ...state,
      trendingGenre: action.genre
    }
  },
  [SET_LAST_FETCHED_TRENDING_GENRE](state, action) {
    return {
      ...state,
      lastFetchedTrendingGenre: action.genre
    }
  }
}

const trendingWeekReducer = asLineup(TRENDING_WEEK_PREFIX, trendingWeek)
const trendingMonthReducer = asLineup(TRENDING_MONTH_PREFIX, trendingMonth)
const trendingAllTimeReducer = asLineup(
  TRENDING_ALL_TIME_PREFIX,
  trendingAllTime
)

const reducer = (state, action) => {
  // On first run, create our initial state
  if (!state) {
    return {
      ...initialState,
      trendingWeek: trendingWeekReducer(state, action),
      trendingMonth: trendingMonthReducer(state, action),
      trendingAllTime: trendingAllTimeReducer(state, action)
    }
  }

  const trendingWeek = trendingWeekReducer(state.trendingWeek, action)
  if (trendingWeek !== state.trendingWeek) return { ...state, trendingWeek }

  const trendingMonth = trendingMonthReducer(state.trendingMonth, action)
  if (trendingMonth !== state.trendingMonth) return { ...state, trendingMonth }

  const trendingAllTime = trendingAllTimeReducer(state.trendingAllTime, action)
  if (trendingAllTime !== state.trendingAllTime) {
    return { ...state, trendingAllTime }
  }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
