import {
  useProxySelector,
  savedPageSelectors,
  lineupSelectors
} from '@audius/common'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconFavorite from 'app/assets/images/iconFavorite.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { DownloadToggle } from 'app/components/offline-downloads'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import { AlbumsTab } from './AlbumsTab'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'
const { makeGetTableMetadatas } = lineupSelectors

const { getSavedTracksLineup } = savedPageSelectors

const getTracks = makeGetTableMetadatas(getSavedTracksLineup)

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
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const savedTracks = useProxySelector(getTracks, [])

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconFavorite}
        styles={{ icon: { marginLeft: 3 } }}
      >
        {isOfflineModeEnabled && (
          <DownloadToggle
            collection={DOWNLOAD_REASON_FAVORITES}
            tracks={savedTracks.entries}
          />
        )}
      </ScreenHeader>
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
