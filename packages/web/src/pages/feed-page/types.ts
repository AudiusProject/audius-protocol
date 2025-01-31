import { FeedFilter, UID, Lineup } from '@audius/common/models'

export interface FeedPageContentProps {
  feedTitle: string
  feedDescription: string
  feedIsMain: boolean
  feed: Lineup<any>

  refreshFeedInView: (overwrite: boolean, limit?: number) => void
  setFeedInView: (inView: boolean) => void
  loadMoreFeed: (offset: number, limit: number, overwrite: boolean) => void
  playFeedTrack: (uid: UID) => void
  pauseFeedTrack: () => void
  switchView: () => void
  feedFilter: FeedFilter
  setFeedFilter: (filter: FeedFilter) => void
  resetFeedLineup: () => void
  scrollParentRef?: HTMLElement
}
