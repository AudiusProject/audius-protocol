import TimeRange from 'common/models/TimeRange'
import { asLineup } from 'common/store/lineup/reducer'
import { GENRES } from 'common/utils/genres'
import {
  SET_TRENDING_GENRE,
  SET_TRENDING_TIME_RANGE,
  SET_LAST_FETCHED_TRENDING_GENRE
} from 'pages/trending-page/store/actions'
import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX
} from 'pages/trending-page/store/lineups/trending/actions'
import {
  trendingWeek,
  trendingMonth,
  trendingAllTime
} from 'pages/trending-page/store/lineups/trending/reducer'

const urlParams = new URLSearchParams(window.location.search)
const genre = urlParams.get('genre')
const timeRange = urlParams.get('timeRange')

const initialState = {
  suggestedFollows: [],
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
