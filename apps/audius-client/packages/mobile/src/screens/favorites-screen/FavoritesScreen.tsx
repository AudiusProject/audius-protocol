import { accountActions } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconFavorite from 'app/assets/images/iconFavorite.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import {
  useIsOfflineModeEnabled,
  useReadOfflineOverride
} from 'app/hooks/useIsOfflineModeEnabled'

import { AlbumsTab } from './AlbumsTab'
import { FavoritesDownloadSection } from './FavoritesDownloadSection'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'
const { fetchSavedPlaylists, fetchSavedAlbums } = accountActions

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
  useAppTabScreen()
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  useReadOfflineOverride()

  useEffectOnce(() => {
    dispatch(fetchSavedPlaylists())
    dispatch(fetchSavedAlbums())
  })

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconFavorite}
        styles={{ icon: { marginLeft: 3 } }}
      >
        {isOfflineModeEnabled ? <FavoritesDownloadSection /> : null}
      </ScreenHeader>
      <ScreenContent isOfflineCapable={isOfflineModeEnabled}>
        <TopTabNavigator
          screens={favoritesScreens}
          screenOptions={{ lazy: true }}
        />
      </ScreenContent>
    </Screen>
  )
}
