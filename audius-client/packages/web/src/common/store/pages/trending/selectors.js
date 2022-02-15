import TimeRange from 'common/models/TimeRange'
import { getUsers } from 'common/store/cache/users/selectors'
import { createShallowSelector } from 'common/utils/selectorHelpers'

export const getSuggestedFollows = state =>
  state.pages.trending.suggestedFollows
export const getDiscoverTrendingLineup = state => state.pages.trending.trending
export const getDiscoverTrendingWeekLineup = state =>
  state.pages.trending.trendingWeek
export const getDiscoverTrendingMonthLineup = state =>
  state.pages.trending.trendingMonth
export const getDiscoverTrendingAllTimeLineup = state =>
  state.pages.trending.trendingAllTime

export const makeGetTrendingLineup = timeRange => state => {
  return {
    [TimeRange.WEEK]: state.pages.trending.trendingWeek,
    [TimeRange.MONTH]: state.pages.trending.trendingMonth,
    [TimeRange.ALL_TIME]: state.pages.trending.trendingAllTime
  }[timeRange]
}

export const getCurrentDiscoverTrendingLineup = state => {
  const timeRange = state.pages.trending.trendingTimeRange
  return makeGetTrendingLineup(timeRange)(state)
}

export const getTrendingTimeRange = state =>
  state.pages.trending.trendingTimeRange
export const getTrendingGenre = state => state.pages.trending.trendingGenre
export const getLastFetchedTrendingGenre = state =>
  state.pages.trending.lastFetchedTrendingGenre

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
