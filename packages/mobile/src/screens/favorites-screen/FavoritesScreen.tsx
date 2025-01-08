import { SavedPageTabs } from '@audius/common/store'

import {
  IconAlbum,
  IconLibrary,
  IconNote,
  IconPlaylists
} from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
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
    name: SavedPageTabs.TRACKS,
    Icon: IconNote,
    component: TracksTab
  },
  {
    name: SavedPageTabs.ALBUMS,
    Icon: IconAlbum,
    component: AlbumsTab
  },
  {
    name: SavedPageTabs.PLAYLISTS,
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
      <ScreenPrimaryContent>
        <ScreenHeader
          text={messages.header}
          icon={IconLibrary}
          styles={headerStyles}
        >
          <FavoritesDownloadSection />
          <LibraryCategorySelectionMenu />
        </ScreenHeader>
      </ScreenPrimaryContent>
      <ScreenContent isOfflineCapable>
        <ScreenSecondaryContent>
          <TopTabNavigator
            screens={favoritesScreens}
            screenOptions={{ lazy: true }}
          />
        </ScreenSecondaryContent>
      </ScreenContent>
    </Screen>
  )
}
