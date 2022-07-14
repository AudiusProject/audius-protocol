import { ID, UID } from '@audius/common'

import FeedFilter from 'common/models/FeedFilter'
import { Lineup } from 'common/models/Lineup'
import { User } from 'common/models/User'

export interface FeedPageContentProps {
  feedTitle: string
  feedDescription: string
  feedIsMain: boolean
  feed: Lineup<any>

  fetchSuggestedFollowUsers: () => void
  followUsers: (userIDs: ID[]) => void
  suggestedFollows: User[]
  refreshFeedInView: (overwrite: boolean, limit?: number) => void
  hasAccount: boolean
  goToSignUp: () => void
  goToTrending: () => void
  setFeedInView: (inView: boolean) => void
  loadMoreFeed: (offset: number, limit: number, overwrite: boolean) => void
  playFeedTrack: (uid: UID) => void
  pauseFeedTrack: () => void
  switchView: () => void
  getLineupProps: (lineup: Lineup<any>) => {
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
}
