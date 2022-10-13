import { FeatureFlags } from '@audius/common'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import { ScreenContent } from '../ScreenContent'

import { AlbumsTab } from './AlbumsTab'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'

const messages = {
  header: 'Favorites'
}

const favoritesScreens = [
  {
    name: 'tracks',
    Icon: IconNote,
    component: TracksTab
  },
  {
    name: 'albums',
    Icon: IconAlbum,
    component: AlbumsTab
  },
  {
    name: 'playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
  }
]

export const FavoritesScreen = () => {
  usePopToTopOnDrawerOpen()
  const { isEnabled: isOfflineModeEnabled } = useFeatureFlag(
    FeatureFlags.OFFLINE_MODE_ENABLED
  )

  return (
    <Screen>
      <Header text={messages.header} />
      {
        // ScreenContent handles the offline indicator.
        // Show favorites screen anyway when offline so users can see their downloads
        isOfflineModeEnabled ? (
          <TopTabNavigator screens={favoritesScreens} />
        ) : (
          <ScreenContent>
            <TopTabNavigator screens={favoritesScreens} />
          </ScreenContent>
        )
      }
    </Screen>
  )
}
