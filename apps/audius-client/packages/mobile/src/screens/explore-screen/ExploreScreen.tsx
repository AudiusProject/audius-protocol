import { explorePageActions } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconExplore from 'app/assets/images/iconExplore.svg'
import IconForYou from 'app/assets/images/iconExploreForYou.svg'
import IconMoods from 'app/assets/images/iconExploreMoods.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'

import { ArtistsTab } from './tabs/ArtistsTab'
import { ForYouTab } from './tabs/ForYouTab'
import { MoodsTab } from './tabs/MoodsTab'
import { PlaylistsTab } from './tabs/PlaylistsTab'

const { fetchExplore } = explorePageActions

const messages = {
  header: 'Explore',
  forYou: 'For You'
}

const exploreScreens = [
  {
    name: 'forYou',
    label: messages.forYou,
    Icon: IconForYou,
    component: ForYouTab
  },
  {
    name: 'moods',
    Icon: IconMoods,
    component: MoodsTab
  },
  {
    name: 'playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
  },
  {
    name: 'artists',
    Icon: IconUser,
    component: ArtistsTab
  }
]

const ExploreScreen = () => {
  const dispatch = useDispatch()
  usePopToTopOnDrawerOpen()

  useEffectOnce(() => {
    dispatch(fetchExplore())
  })

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconExplore}
        iconProps={{ height: 30 }}
        styles={{ icon: { marginLeft: 1 } }}
      />
      <ScreenContent>
        <TopTabNavigator screens={exploreScreens} />
      </ScreenContent>
    </Screen>
  )
}

export default ExploreScreen
