import { createShallowSelector } from 'utils/selectorHelpers'
import { getUsers } from 'store/cache/users/selectors'
import TimeRange from 'models/TimeRange'

export const getSuggestedFollows = state => state.discover.suggestedFollows
export const getDiscoverFeedLineup = state => state.discover.feed
export const getDiscoverTrendingLineup = state => state.discover.trending
export const getDiscoverTrendingWeekLineup = state =>
  state.discover.trendingWeek
export const getDiscoverTrendingMonthLineup = state =>
  state.discover.trendingMonth
export const getDiscoverTrendingYearLineup = state =>
  state.discover.trendingYear

export const makeGetTrendingLineup = timeRange => state => {
  return {
    [TimeRange.WEEK]: state.discover.trendingWeek,
    [TimeRange.MONTH]: state.discover.trendingMonth,
    [TimeRange.YEAR]: state.discover.trendingYear
  }[timeRange]
}

export const getCurrentDiscoverTrendingLineup = state => {
  const timeRange = state.discover.trendingTimeRange
  return makeGetTrendingLineup(timeRange)(state)
}

export const getFeedFilter = state => state.discover.feedFilter

export const getTrendingTimeRange = state => state.discover.trendingTimeRange
export const getTrendingGenre = state => state.discover.trendingGenre
export const getLastFetchedTrendingGenre = state =>
  state.discover.lastFetchedTrendingGenre

export const getSuggestedFollowUsers = state =>
  getUsers(state, { ids: getSuggestedFollows(state) })

export const makeGetSuggestedFollows = () => {
  return createShallowSelector(
    [getSuggestedFollowUsers, getSuggestedFollows],
    (users, followIds) => {
      return followIds.map(id => users[id]).filter(Boolean)
    }
  )
}
