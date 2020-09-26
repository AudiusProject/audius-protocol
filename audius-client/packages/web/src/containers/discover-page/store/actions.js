export const FETCH_SUGGESTED_FOLLOW_USERS =
  'DISCOVER/FETCH_SUGGESTED_FOLLOW_USERS'
export const FOLLOW_USERS = 'DISCOVER/FOLLOW_USERS'
export const SET_SUGGESTED_FOLLOWS = 'DISCOVER/SET_SUGGESTED_FOLLOWS'
export const SET_FEED_FILTER = 'DISCOVER/SET_FEED_FILTER'
export const SET_TRENDING_GENRE = 'DISCOVER/SET_TRENDING_GENRE'
export const SET_TRENDING_TIME_RANGE = 'DISCOVER/SET_TRENDING_TIME_RANGE'
export const SET_LAST_FETCHED_TRENDING_GENRE =
  'DISCOVER/SET_LAST_FETCHED_TRENDING_GENRE'

export const fetchSuggestedFollowUsers = () => ({
  type: FETCH_SUGGESTED_FOLLOW_USERS
})

export const followUsers = userIds => ({
  type: FOLLOW_USERS,
  userIds
})

export const setSuggestedFollows = userIds => ({
  type: SET_SUGGESTED_FOLLOWS,
  userIds
})

export const setFeedFilter = filter => ({
  type: SET_FEED_FILTER,
  filter
})

export const setTrendingGenre = genre => ({
  type: SET_TRENDING_GENRE,
  genre
})

export const setTrendingTimeRange = timeRange => ({
  type: SET_TRENDING_TIME_RANGE,
  timeRange
})

export const setLastFetchedTrendingGenre = genre => ({
  type: SET_LAST_FETCHED_TRENDING_GENRE,
  genre
})
