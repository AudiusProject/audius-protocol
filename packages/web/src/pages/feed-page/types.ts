import { FeedFilter, ID, UID, Lineup } from '@audius/common/models'

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
