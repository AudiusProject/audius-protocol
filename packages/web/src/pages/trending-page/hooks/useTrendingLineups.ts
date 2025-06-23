import { useCallback, RefObject } from 'react'

import { useSelector } from 'react-redux'

import { TrendingLineupsReturn, TrendingPageHookReturn } from '../providerTypes'
import { selectTrendingPageData } from '../selectors'
import { createLineupProps, getLineupForTimeRange, scrollToTop } from '../utils'

interface UseTrendingLineupsProps {
  trendingPageState: TrendingPageHookReturn
  containerRef?: RefObject<HTMLDivElement>
}

/**
 * Hook that manages lineup selection and properties for the trending page
 */
export const useTrendingLineups = ({
  trendingPageState,
  containerRef
}: UseTrendingLineupsProps): TrendingLineupsReturn => {
  // Redux state for lineups and player
  const {
    trendingWeek,
    trendingMonth,
    trendingAllTime,
    uid: playingUid,
    source,
    playing,
    buffering
  } = useSelector(selectTrendingPageData)

  const { currentTrack } = trendingPageState

  // Create lineup props for a given lineup
  const getLineupProps = useCallback(
    (lineup: any) => {
      return createLineupProps(
        lineup,
        playingUid,
        source,
        currentTrack,
        playing,
        buffering,
        containerRef
      )
    },
    [playingUid, source, currentTrack, playing, buffering, containerRef]
  )

  // Get lineup for a specific time range
  const getLineupForRangeCallback = useCallback(
    (timeRange: any) => {
      return getLineupForTimeRange(
        timeRange,
        trendingWeek,
        trendingMonth,
        trendingAllTime,
        getLineupProps
      )
    },
    [getLineupProps, trendingWeek, trendingMonth, trendingAllTime]
  )

  // Scroll to top for a given time range
  const scrollToTopCallback = useCallback(
    (timeRange: any) => {
      scrollToTop(timeRange, getLineupForRangeCallback)
    },
    [getLineupForRangeCallback]
  )

  return {
    trendingWeek,
    trendingMonth,
    trendingAllTime,
    getLineupProps,
    getLineupForRange: getLineupForRangeCallback,
    scrollToTop: scrollToTopCallback
  }
}
