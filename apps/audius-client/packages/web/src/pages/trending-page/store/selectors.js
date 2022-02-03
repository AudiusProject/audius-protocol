import TimeRange from 'common/models/TimeRange'
import { getUsers } from 'common/store/cache/users/selectors'
import { createShallowSelector } from 'common/utils/selectorHelpers'

export const getSuggestedFollows = state => state.trending.suggestedFollows
export const getDiscoverTrendingLineup = state => state.trending.trending
export const getDiscoverTrendingWeekLineup = state =>
  state.trending.trendingWeek
export const getDiscoverTrendingMonthLineup = state =>
  state.trending.trendingMonth
export const getDiscoverTrendingAllTimeLineup = state =>
  state.trending.trendingAllTime

export const makeGetTrendingLineup = timeRange => state => {
  return {
    [TimeRange.WEEK]: state.trending.trendingWeek,
    [TimeRange.MONTH]: state.trending.trendingMonth,
    [TimeRange.ALL_TIME]: state.trending.trendingAllTime
  }[timeRange]
}

export const getCurrentDiscoverTrendingLineup = state => {
  const timeRange = state.trending.trendingTimeRange
  return makeGetTrendingLineup(timeRange)(state)
}

export const getTrendingTimeRange = state => state.trending.trendingTimeRange
export const getTrendingGenre = state => state.trending.trendingGenre
export const getLastFetchedTrendingGenre = state =>
  state.trending.lastFetchedTrendingGenre

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
