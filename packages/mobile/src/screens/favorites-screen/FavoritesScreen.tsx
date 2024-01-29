import { IconAlbum } from '@audius/harmony-native'
import IconLibrary from 'app/assets/images/iconLibrary.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { makeStyles } from 'app/styles'

import { AlbumsTab } from './AlbumsTab'
import { FavoritesDownloadSection } from './FavoritesDownloadSection'
import { LibraryCategorySelectionMenu } from './LibraryCategorySelectionMenu'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'

const messages = {
  header: 'Library'
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

const useHeaderStyles = makeStyles(({ spacing }) => ({
  root: {
    flexWrap: 'wrap',
    height: 88,
    paddingVertical: spacing(2)
  }
}))

export const FavoritesScreen = () => {
  useAppTabScreen()
  const headerStyles = useHeaderStyles()

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconLibrary}
        styles={headerStyles}
      >
        <FavoritesDownloadSection />
        <LibraryCategorySelectionMenu />
      </ScreenHeader>
      <ScreenContent isOfflineCapable>
        <TopTabNavigator
          screens={favoritesScreens}
          screenOptions={{ lazy: true }}
        />
      </ScreenContent>
    </Screen>
  )
}
