import { ExplorePageTabs } from '@audius/common/store'

import {
  IconStars as IconForYou,
  IconMood as IconMoods,
  IconNote,
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
  title: 'Explore',
  forYou: 'For You',
  moods: 'Moods',
  playlists: 'Playlists',
  artists: 'Artists'
}

const screens = [
  {
    name: ExplorePageTabs.FOR_YOU,
    label: messages.forYou,
    Icon: IconForYou,
    component: ForYouTab
  },
  {
    name: ExplorePageTabs.MOODS,
    label: messages.moods,
    Icon: IconMoods,
    component: MoodsTab
  },
  {
    name: ExplorePageTabs.PLAYLISTS,
    label: messages.playlists,
    Icon: IconNote,
    component: FeaturedPlaylistsTab
  },
  {
    name: ExplorePageTabs.PROFILES,
    label: messages.artists,
    Icon: IconUser,
    component: FeaturedProfilesTab
  }
]

export const ExploreScreen = () => {
  useAppTabScreen()

  return (
    <Screen>
      <TopTabNavigator screens={screens} screenOptions={{ lazy: true }} />
    </Screen>
  )
}
