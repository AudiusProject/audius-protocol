import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { useIsMobile } from 'hooks/useIsMobile'
import { createSeoDescription } from 'utils/seo'

import DesktopExplorePage from './components/desktop/ExplorePage'
import NewDesktopExplorePage from './components/desktop/NewExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'
import SearchExplorePage from './components/mobile/SearchExplorePage'

const messages = {
  title: 'Explore',
  pageTitle: 'Explore featured content on Audius',
  description: createSeoDescription('Explore featured content on Audius')
}

export const ExplorePage = () => {
  const isMobile = useIsMobile()

  const { isEnabled: isSearchExploreEnabled, isLoaded } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE
  )
  if (!isLoaded) {
    // prevent flicker while loading feature flag
    return null
  }

  const props = {
    title: messages.title,
    pageTitle: messages.pageTitle,
    description: messages.description
  }

  const Component = isMobile
    ? SearchExplorePage
    : isSearchExploreEnabled
      ? NewDesktopExplorePage
      : DesktopExplorePage
  return <Component {...props} />
}
