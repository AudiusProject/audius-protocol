import { ExploreButton } from './ExploreButton'
import { FavoritesButton } from './FavoritesButton'
import { FeedButton } from './FeedButton'
import { ProfileButton } from './ProfileButton'
import { TrendingButton } from './TrendingButton'

export const bottomTabBarButtons = {
  feed: FeedButton,
  trending: TrendingButton,
  explore: ExploreButton,
  favorites: FavoritesButton,
  profile: ProfileButton
}

export * from './ExploreButton'
export * from './FavoritesButton'
export * from './FeedButton'
export * from './ProfileButton'
export * from './TrendingButton'
