import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'

import { AlbumsTab } from './AlbumsTab'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'

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

const FavoritesScreen = () => {
  return (
    <Screen>
      <Header text='Favorites' />
      <TopTabNavigator screens={favoritesScreens} />
    </Screen>
  )
}

export default FavoritesScreen
