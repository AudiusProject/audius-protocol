import { useHasAccount } from '@audius/common/api'
import { useCurrentTrack } from '@audius/common/hooks'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'

import { TrendingPageHookReturn } from '../providerTypes'
import { selectTrendingPageData } from '../selectors'

/**
 * Hook that manages core trending page state from Redux and other sources
 */
export const useTrendingPageState = (): TrendingPageHookReturn => {
  // Redux state
  const { trendingGenre, trendingTimeRange, lastFetchedTrendingGenre } =
    useSelector(selectTrendingPageData)

  // Other hooks
  const hasAccount = useHasAccount()
  const isMobile = useIsMobile()
  const currentTrack = useCurrentTrack()

  return {
    trendingGenre,
    trendingTimeRange,
    lastFetchedTrendingGenre,
    hasAccount,
    isMobile,
    currentTrack
  }
}
