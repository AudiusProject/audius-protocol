import { asLineup } from 'store/lineup/reducer'
import feedReducer from 'containers/discover-page/store/lineups/feed/reducer'
import { PREFIX as FeedPrefix } from 'containers/discover-page/store/lineups/feed/actions'
import {
  trendingWeek,
  trendingMonth,
  trendingYear
} from 'containers/discover-page/store/lineups/trending/reducer'
import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_YEAR_PREFIX
} from 'containers/discover-page/store/lineups/trending/actions'
import TimeRange from 'models/TimeRange'
import { GENRES } from 'utils/genres'

import {
  SET_SUGGESTED_FOLLOWS,
  SET_FEED_FILTER,
  SET_TRENDING_GENRE,
  SET_TRENDING_TIME_RANGE,
  SET_LAST_FETCHED_TRENDING_GENRE
} from 'containers/discover-page/store/actions'

import FeedFilter from 'models/FeedFilter'

const urlParams = new URLSearchParams(window.location.search)
const genre = urlParams.get('genre')
const timeRange = urlParams.get('timeRange')

const initialState = {
  suggestedFollows: [],
  feedFilter: FeedFilter.ALL,
  trendingTimeRange: Object.values(TimeRange).includes(timeRange)
    ? timeRange
    : TimeRange.WEEK,
  trendingGenre: Object.values(GENRES).includes(genre) ? genre : null,
  lastFetchedTrendingGenre: null
}

const actionsMap = {
  [SET_SUGGESTED_FOLLOWS](state, action) {
    return {
      ...state,
      suggestedFollows: action.userIds
    }
  },
  [SET_FEED_FILTER](state, action) {
    return {
      ...state,
      feedFilter: action.filter
    }
  },
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

const feedLineupReducer = asLineup(FeedPrefix, feedReducer)
const trendingWeekReducer = asLineup(TRENDING_WEEK_PREFIX, trendingWeek)
const trendingMonthReducer = asLineup(TRENDING_MONTH_PREFIX, trendingMonth)
const trendingYearReducer = asLineup(TRENDING_YEAR_PREFIX, trendingYear)

const reducer = (state, action) => {
  // On first run, create our initial state
  if (!state) {
    return {
      ...initialState,
      feed: feedLineupReducer(state, action),
      trendingWeek: trendingWeekReducer(state, action),
      trendingMonth: trendingMonthReducer(state, action),
      trendingYear: trendingYearReducer(state, action)
    }
  }

  const feed = feedLineupReducer(state.feed, action)
  if (feed !== state.feed) return { ...state, feed }

  const trendingWeek = trendingWeekReducer(state.trendingWeek, action)
  if (trendingWeek !== state.trendingWeek) return { ...state, trendingWeek }

  const trendingMonth = trendingMonthReducer(state.trendingMonth, action)
  if (trendingMonth !== state.trendingMonth) return { ...state, trendingMonth }

  const trendingYear = trendingYearReducer(state.trendingYear, action)
  if (trendingYear !== state.trendingYear) return { ...state, trendingYear }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
