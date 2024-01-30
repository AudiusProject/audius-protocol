import { Genre } from '~/utils'

import { TimeRange } from '../../../models'

export const SET_TRENDING_GENRE = 'TRENDING/SET_TRENDING_GENRE'
export const SET_TRENDING_TIME_RANGE = 'TRENDING/SET_TRENDING_TIME_RANGE'
export const SET_LAST_FETCHED_TRENDING_GENRE =
  'TRENDING/SET_LAST_FETCHED_TRENDING_GENRE'

export const setTrendingGenre = (genre: Genre | null) => ({
  type: SET_TRENDING_GENRE,
  genre
})

export const setTrendingTimeRange = (timeRange: TimeRange) => ({
  type: SET_TRENDING_TIME_RANGE,
  timeRange
})

export const setLastFetchedTrendingGenre = (genre: Genre | null) => ({
  type: SET_LAST_FETCHED_TRENDING_GENRE,
  genre
})
