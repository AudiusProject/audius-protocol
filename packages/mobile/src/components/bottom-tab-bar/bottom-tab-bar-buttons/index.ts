import { ExploreButton } from './ExploreButton'
import { FeedButton } from './FeedButton'
import { LibraryButton } from './LibraryButton'
import { NotificationsButton } from './NotificationsButton'
import { TrendingButton } from './TrendingButton'

export const bottomTabBarButtons = {
  feed: FeedButton,
  trending: TrendingButton,
  explore: ExploreButton,
  library: LibraryButton,
  notifications: NotificationsButton
}

export * from './ExploreButton'
export * from './LibraryButton'
export * from './FeedButton'
export * from './TrendingButton'
export * from './NotificationsButton'
