import { ID, UID } from 'models/common/Identifiers'
import TimeRange from 'models/TimeRange'
import User from 'models/User'

import FeedFilter from 'models/FeedFilter'
import { Lineup } from 'models/common/Lineup'
import Track from 'models/Track'

type ExtraTrendingLineupProps = {
  antiBot: boolean
}

export interface DiscoverPageContentProps {
  feedTitle: string
  feedDescription: string
  feedIsMain: boolean
  feed: Lineup<any>

  trendingTitle: string
  trendingDescription: string
  trending: Lineup<any>
  trendingWeek: Lineup<any, ExtraTrendingLineupProps>
  trendingMonth: Lineup<any, ExtraTrendingLineupProps>
  trendingYear: Lineup<any, ExtraTrendingLineupProps>

  fetchSuggestedFollowUsers: () => void
  followUsers: (userIDs: ID[]) => void
  suggestedFollows: User[]
  playTrendingTrack: (uid: UID) => void
  pauseTrendingTrack: () => void
  refreshTrendingInView: (overwrite: boolean) => void
  refreshFeedInView: (overwrite: boolean, limit?: number) => void
  hasAccount: boolean
  goToFeed: () => void
  goToTrending: () => void
  goToSignUp: () => void
  goToGenreSelection: () => void
  setFeedInView: (inView: boolean) => void
  setTrendingInView: (inView: boolean) => void
  loadMoreFeed: (offset: number, limit: number, overwrite: boolean) => void
  playFeedTrack: (uid: UID) => void
  pauseFeedTrack: () => void
  switchView: () => void
  getLineupProps: (
    lineup: Lineup<any>
  ) => {
    lineup: Lineup<any>
    playingUid: UID
    playingSource: string
    playingTrackId: ID | null
    playing: boolean
    buffering: boolean
    scrollParent: HTMLElement | null
    selfLoad: boolean
  }
  feedFilter: FeedFilter
  setFeedFilter: (filter: FeedFilter) => void
  resetFeedLineup: () => void
  resetTrendingLineup: () => void

  trendingGenre: string | null
  trendingTimeRange: TimeRange
  lastFetchedTrendingGenre: string | null
  setTrendingGenre: (genre: string | null) => void
  setTrendingTimeRange: (timeRange: TimeRange) => void

  makeLoadMore: (
    timeRange: TimeRange
  ) => (offset: number, limit: number, overwrite: boolean) => void
  makePlayTrack: (timeRange: TimeRange) => (uid: string) => void
  makePauseTrack: (timeRange: TimeRange) => () => void
  makeSetInView: (timeRange: TimeRange) => (inView: boolean) => void
  makeRefreshTrendingInView: (
    timeRange: TimeRange
  ) => (overwrite: boolean) => void
  makeResetTrending: (timeRange: TimeRange) => () => void

  getLineupForRange: (
    timeRange: TimeRange
  ) => {
    playingUid: UID
    lineup: Lineup<Track>
    playingSource: any
    playingTrackId: ID | null
    playing: boolean
    buffering: boolean
    scrollParent: HTMLElement | null
    selfLoad: boolean
  }
  scrollToTop: (timeRange: TimeRange) => void
}
