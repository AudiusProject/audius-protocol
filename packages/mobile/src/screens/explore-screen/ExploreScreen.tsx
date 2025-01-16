import { explorePageActions, ExplorePageTabs } from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import {
  IconExplore,
  IconStars,
  IconMood,
  IconPlaylists,
  IconUser
} from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { ArtistsTab } from './tabs/ArtistsTab'
import { ForYouTab } from './tabs/ForYouTab'
import { MoodsTab } from './tabs/MoodsTab'
import { PlaylistsTab } from './tabs/PlaylistsTab'

const { fetchExplore } = explorePageActions

const messages = {
  header: 'Explore'
}

const exploreScreens = [
  {
    name: ExplorePageTabs.FOR_YOU,
    Icon: IconStars,
    component: ForYouTab
  },
  {
    name: ExplorePageTabs.MOODS,
    Icon: IconMood,
    component: MoodsTab
  },
  {
    name: ExplorePageTabs.PLAYLISTS,
    Icon: IconPlaylists,
    component: PlaylistsTab
  },
  {
    name: ExplorePageTabs.PROFILES,
    Icon: IconUser,
    component: ArtistsTab
  }
]

const ExploreScreen = () => {
  const dispatch = useDispatch()
  useAppTabScreen()

  useEffectOnce(() => {
    dispatch(fetchExplore())
  })

  return (
    <Screen>
      <ScreenPrimaryContent>
        <ScreenHeader
          text={messages.header}
          icon={IconExplore}
          iconProps={{ height: 30 }}
        />
      </ScreenPrimaryContent>
      <ScreenContent>
        <ScreenSecondaryContent>
          <TopTabNavigator
            screens={exploreScreens}
            screenOptions={{ lazy: true }}
          />
        </ScreenSecondaryContent>
      </ScreenContent>
    </Screen>
  )
}

export default ExploreScreen
