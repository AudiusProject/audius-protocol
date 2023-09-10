import { ExploreButton } from './ExploreButton'
import { FavoritesButton } from './FavoritesButton'
import { FeedButton } from './FeedButton'
import { NotificationsButton } from './NotificationsButton'
import { TrendingButton } from './TrendingButton'

export const bottomTabBarButtons = {
  feed: FeedButton,
  trending: TrendingButton,
  explore: ExploreButton,
  favorites: FavoritesButton,
  notifications: NotificationsButton
}

export * from './ExploreButton'
export * from './FavoritesButton'
export * from './FeedButton'
export * from './TrendingButton'
export * from './NotificationsButton'
