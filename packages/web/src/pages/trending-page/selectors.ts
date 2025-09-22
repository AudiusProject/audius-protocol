import {
  lineupSelectors,
  trendingPageSelectors,
  queueSelectors,
  playerSelectors,
  CommonState
} from '@audius/common/store'
import { createSelector } from '@reduxjs/toolkit'

// Individual selectors
const { getSource } = queueSelectors
const { getBuffering, getPlaying, getUid } = playerSelectors
const {
  getDiscoverTrendingAllTimeLineup,
  getDiscoverTrendingMonthLineup,
  getDiscoverTrendingWeekLineup,
  getLastFetchedTrendingGenre,
  getTrendingGenre,
  getTrendingTimeRange
} = trendingPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

// Memoized lineup selectors factory
export const makeTrendingPageSelectors = () => {
  const getTrendingWeekLineup = makeGetLineupMetadatas(
    getDiscoverTrendingWeekLineup
  )
  const getTrendingMonthLineup = makeGetLineupMetadatas(
    getDiscoverTrendingMonthLineup
  )
  const getTrendingAllTimeLineup = makeGetLineupMetadatas(
    getDiscoverTrendingAllTimeLineup
  )

  return {
    getTrendingWeekLineup,
    getTrendingMonthLineup,
    getTrendingAllTimeLineup
  }
}

// Combined trending lineup selector
export const selectTrendingLineups = createSelector(
  [
    (state: CommonState) => {
      const selectors = makeTrendingPageSelectors()
      return {
        trendingWeek: selectors.getTrendingWeekLineup(state),
        trendingMonth: selectors.getTrendingMonthLineup(state),
        trendingAllTime: selectors.getTrendingAllTimeLineup(state)
      }
    }
  ],
  (lineups) => lineups
)

// Combined player state selector
export const selectPlayerState = createSelector(
  [getUid, getSource, getPlaying, getBuffering],
  (uid, source, playing, buffering) => ({
    uid,
    source,
    playing,
    buffering
  })
)

// Combined trending page state selector
export const selectTrendingPageState = createSelector(
  [getTrendingTimeRange, getTrendingGenre, getLastFetchedTrendingGenre],
  (trendingTimeRange, trendingGenre, lastFetchedTrendingGenre) => ({
    trendingTimeRange,
    trendingGenre,
    lastFetchedTrendingGenre
  })
)

// Combined state selector for the entire trending page
export const selectTrendingPageData = createSelector(
  [selectTrendingLineups, selectPlayerState, selectTrendingPageState],
  (lineups, playerState, pageState) => ({
    ...lineups,
    ...playerState,
    ...pageState
  })
)
