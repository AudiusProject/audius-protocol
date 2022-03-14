import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconCollectibles from 'app/assets/images/iconCollectibles.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import { TabNavigator, tabScreen } from 'app/components/top-tab-bar'

import { AlbumsTab } from './AlbumsTab'
import { CollectiblesTab } from './CollectiblesTab'
import { PlaylistsTab } from './PlaylistsTab'
import { RepostsTab } from './RepostsTab'
import { TracksTab } from './TracksTab'
import { useSelectProfile } from './selectors'
import { useShouldShowCollectiblesTab } from './utils'

export const ProfileTabNavigator = () => {
  const { user_id, track_count } = useSelectProfile(['user_id', 'track_count'])

  const initialParams = { id: user_id }

  const isArtist = track_count > 0

  const showCollectiblesTab = useShouldShowCollectiblesTab()

  const trackScreen = tabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab,
    initialParams
  })

  const albumsScreen = tabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams
  })

  const playlistsScreen = tabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab,
    initialParams
  })

  const repostsScreen = tabScreen({
    name: 'Reposts',
    Icon: IconRepost,
    component: RepostsTab,
    initialParams
  })

  const collectiblesScreen = tabScreen({
    name: 'Collectibles',
    Icon: IconCollectibles,
    component: CollectiblesTab,
    initialParams
  })

  const screenOptions = {
    lazy: true
  }

  if (isArtist) {
    return (
      <TabNavigator screenOptions={screenOptions}>
        {trackScreen}
        {albumsScreen}
        {playlistsScreen}
        {repostsScreen}
        {showCollectiblesTab ? collectiblesScreen : null}
      </TabNavigator>
    )
  }

  return (
    <TabNavigator screenOptions={screenOptions}>
      {repostsScreen}
      {playlistsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </TabNavigator>
  )
}
