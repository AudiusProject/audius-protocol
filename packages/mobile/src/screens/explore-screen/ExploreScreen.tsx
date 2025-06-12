import { ExplorePageTabs } from '@audius/common/store'

import {
  IconStars as IconForYou,
  IconMood as IconMoods,
  IconPlaylists,
  IconUser
} from '@audius/harmony-native'
import { Screen } from 'app/components/core'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { FeaturedPlaylistsTab } from './tabs/FeaturedPlaylistsTab'
import { FeaturedProfilesTab } from './tabs/FeaturedProfilesTab'
import { ForYouTab } from './tabs/ForYouTab'
import { MoodsTab } from './tabs/MoodsTab'

const messages = {
  header: 'Explore'
}

const screens = [
  {
    name: ExplorePageTabs.FOR_YOU,
    Icon: IconForYou,
    component: ForYouTab
  },
  {
    name: ExplorePageTabs.MOODS,
    Icon: IconMoods,
    component: MoodsTab
  },
  {
    name: ExplorePageTabs.PLAYLISTS,
    Icon: IconPlaylists,
    component: FeaturedPlaylistsTab
  },
  {
    name: ExplorePageTabs.PROFILES,
    Icon: IconUser,
    component: FeaturedProfilesTab
  }
]

export const ExploreScreen = () => {
  useAppTabScreen()

  return (
    <Screen title={messages.header}>
      <TopTabNavigator screens={screens} screenOptions={{ lazy: true }} />
    </Screen>
  )
}
