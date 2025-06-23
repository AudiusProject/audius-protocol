import { useEffect } from 'react'

import { TimeRange } from '@audius/common/models'

import { TrendingActionsReturn, TrendingPageHookReturn } from '../providerTypes'

interface UseTrendingPageCleanupProps {
  trendingPageState: TrendingPageHookReturn
  actions: TrendingActionsReturn
}

/**
 * Hook that handles component lifecycle cleanup for the trending page
 */
export const useTrendingPageCleanup = ({
  trendingPageState,
  actions
}: UseTrendingPageCleanupProps): void => {
  const { isMobile, hasAccount } = trendingPageState
  const { resetTrendingLineup, makeResetTrending } = actions

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only reset if we're not on mobile (mobile should
      // preserve the current tab + state) or there was no
      // account (because the lineups could contain stale content).
      if (!isMobile || !hasAccount) {
        resetTrendingLineup()
        makeResetTrending(TimeRange.WEEK)()
        makeResetTrending(TimeRange.MONTH)()
        makeResetTrending(TimeRange.ALL_TIME)()
      }
    }
  }, [isMobile, hasAccount, resetTrendingLineup, makeResetTrending])
}
