import { useCallback, useEffect } from 'react'

import {
  TrendingPageHookReturn,
  TrendingUrlParamsReturn
} from '../providerTypes'
import {
  parseUrlParams,
  isValidGenre,
  isValidTimeRange,
  updateGenreUrlParam,
  updateTimeRangeUrlParam
} from '../utils'

interface UseTrendingUrlParamsProps {
  trendingPageState: TrendingPageHookReturn
  setTrendingGenre: (genre: string | null) => void
  setTrendingTimeRange: (timeRange: any) => void
  replaceRoute: (route: { search: string }) => void
}

/**
 * Hook that handles URL parameter synchronization for the trending page
 */
export const useTrendingUrlParams = ({
  trendingPageState,
  setTrendingGenre,
  setTrendingTimeRange,
  replaceRoute
}: UseTrendingUrlParamsProps): TrendingUrlParamsReturn => {
  const { trendingGenre, trendingTimeRange } = trendingPageState

  // URL parameter update functions
  const updateGenreUrlParamCallback = useCallback(
    (genre: any) => {
      updateGenreUrlParam(genre, replaceRoute)
    },
    [replaceRoute]
  )

  const updateTimeRangeUrlParamCallback = useCallback(
    (timeRange: any) => {
      updateTimeRangeUrlParam(timeRange, replaceRoute)
    },
    [replaceRoute]
  )

  // Initialize from URL parameters on mount
  useEffect(() => {
    const { genre, timeRange } = parseUrlParams()
    const isValidGenreValue = isValidGenre(genre)
    const isValidTimeRangeValue = isValidTimeRange(timeRange)

    // NOTE: b/c genre can be changed from a modal state, we need to check props before using url params
    if (trendingGenre) {
      updateGenreUrlParamCallback(trendingGenre)
    } else if (isValidGenreValue) {
      setTrendingGenre(genre)
    }

    if (isValidTimeRangeValue) {
      setTrendingTimeRange(timeRange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL params when timeRange changes
  useEffect(() => {
    updateTimeRangeUrlParamCallback(trendingTimeRange)
  }, [trendingTimeRange, updateTimeRangeUrlParamCallback])

  // Update URL params when genre changes
  useEffect(() => {
    updateGenreUrlParamCallback(trendingGenre)
  }, [trendingGenre, updateGenreUrlParamCallback])

  return {
    updateGenreUrlParam: updateGenreUrlParamCallback,
    updateTimeRangeUrlParam: updateTimeRangeUrlParamCallback
  }
}
