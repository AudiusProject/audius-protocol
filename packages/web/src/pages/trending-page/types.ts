import { TimeRange, ID, UID, Lineup, User } from '@audius/common/models'
import { LineupQueryData } from '@audius/common/src/api'

export interface TrendingPageContentProps {
  trendingTitle: string
  pageTitle: string
  trendingDescription: string

  fetchSuggestedFollowUsers: () => void
  followUsers: (userIDs: ID[]) => void
  suggestedFollows: User[]
  playTrendingTrack: (uid: UID) => void
  pauseTrendingTrack: () => void
  refreshTrendingInView: (overwrite: boolean) => void
  hasAccount: boolean
  goToTrending: () => void
  goToSignUp: () => void
  goToGenreSelection: () => void
  setTrendingInView: (inView: boolean) => void
  switchView: () => void
  getLineupProps: (lineup: Lineup<any>) => {
    lineup: Lineup<any>
    playingUid: UID | null
    playingSource: string | null
    playingTrackId: ID | null
    playing: boolean
    buffering: boolean
    scrollParent: HTMLElement | null
    selfLoad: boolean
  }
  resetTrendingLineup: () => void

  trendingGenre: string | null
  trendingTimeRange: TimeRange
  lastFetchedTrendingGenre: string | null
  setTrendingGenre: (genre: string | null) => void
  setTrendingTimeRange: (timeRange: TimeRange) => void

  scrollToTop: (timeRange: TimeRange) => void
  trendingQueryData: LineupQueryData
}
