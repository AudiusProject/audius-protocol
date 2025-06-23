import { useMemo } from 'react'

import { TRENDING_MESSAGES } from './constants'
import { useTrendingActions } from './hooks/useTrendingActions'
import { useTrendingLineups } from './hooks/useTrendingLineups'
import { useTrendingPageCleanup } from './hooks/useTrendingPageCleanup'
import { useTrendingPageState } from './hooks/useTrendingPageState'
import { useTrendingUrlParams } from './hooks/useTrendingUrlParams'
import { TrendingPageOwnProps } from './providerTypes'
import { TrendingPageContentProps } from './types'

/**
 * TrendingPageProvider using modern React hooks pattern
 */

const TrendingPageProvider = ({
  containerRef,
  children: Children
}: TrendingPageOwnProps) => {
  // Custom hooks for state and actions
  const trendingPageState = useTrendingPageState()
  const actions = useTrendingActions()
  const lineups = useTrendingLineups({
    trendingPageState,
    containerRef: containerRef || undefined
  })

  // URL parameter management
  useTrendingUrlParams({
    trendingPageState,
    setTrendingGenre: actions.setTrendingGenre,
    setTrendingTimeRange: actions.setTrendingTimeRange,
    replaceRoute: actions.replaceRoute
  })

  // Cleanup hook
  useTrendingPageCleanup({ trendingPageState, actions })

  // Simple prop composition using useMemo for performance
  const childProps: TrendingPageContentProps = useMemo(
    () => ({
      // Static messages
      trendingTitle: TRENDING_MESSAGES.trendingTitle,
      pageTitle: TRENDING_MESSAGES.pageTitle,
      trendingDescription: TRENDING_MESSAGES.trendingDescription,

      // Core state
      trending: {} as any, // Legacy prop, not used
      trendingGenre: trendingPageState.trendingGenre,
      trendingTimeRange: trendingPageState.trendingTimeRange,
      lastFetchedTrendingGenre: trendingPageState.lastFetchedTrendingGenre,
      hasAccount: trendingPageState.hasAccount,

      // Lineup data
      trendingWeek: lineups.trendingWeek,
      trendingMonth: lineups.trendingMonth,
      trendingAllTime: lineups.trendingAllTime,
      getLineupProps: lineups.getLineupProps,
      getLineupForRange: lineups.getLineupForRange,
      scrollToTop: lineups.scrollToTop,

      // Actions
      goToSignUp: actions.goToSignUp,
      goToGenreSelection: actions.goToGenreSelection,
      setTrendingGenre: actions.setTrendingGenre,
      setTrendingTimeRange: actions.setTrendingTimeRange,
      playTrendingTrack: actions.playTrendingTrack,
      pauseTrendingTrack: actions.pauseTrendingTrack,
      refreshTrendingInView: actions.refreshTrendingInView,
      resetTrendingLineup: actions.resetTrendingLineup,

      // Action factories
      makeLoadMore: actions.makeLoadMore,
      makePlayTrack: actions.makePlayTrack,
      makePauseTrack: actions.makePauseTrack,
      makeSetInView: actions.makeSetInView,
      makeRefreshTrendingInView: actions.makeRefreshTrendingInView,
      makeResetTrending: actions.makeResetTrending,

      // Legacy/unused props
      goToTrending: () => {}, // Not defined in original
      switchView: () => {}, // Not defined in original
      fetchSuggestedFollowUsers: () => {}, // Not used
      followUsers: () => {}, // Not used
      suggestedFollows: [], // Not used
      setTrendingInView: () => {} // Not used
    }),
    [trendingPageState, actions, lineups]
  )

  return <Children {...childProps} />
}

export default TrendingPageProvider
