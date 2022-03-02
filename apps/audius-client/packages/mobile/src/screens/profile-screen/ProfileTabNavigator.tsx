import { User } from 'audius-client/src/common/models/User'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconCollectibles from 'app/assets/images/iconCollectibles.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import {
  TabNavigator,
  tabScreen
} from 'app/components/app-navigator/TopTabNavigator'

import { AlbumsTab } from './AlbumsTab'
import { CollectiblesTab } from './CollectiblesTab'
import { PlaylistsTab } from './PlaylistsTab'
import { RepostsTab } from './RepostsTab'
import { TracksTab } from './TracksTab'
import { useShouldShowCollectiblesTab } from './utils'

type ProfileTabNavigatiorProps = {
  profile: User
}

export const ProfileTabNavigator = ({ profile }: ProfileTabNavigatiorProps) => {
  const isArtist = profile.track_count > 0

  const showCollectiblesTab = useShouldShowCollectiblesTab(profile)

  const trackScreen = tabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab
  })

  const albumsScreen = tabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab
  })

  const playlistsScreen = tabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
  })

  const repostsScreen = tabScreen({
    name: 'Reposts',
    Icon: IconRepost,
    component: RepostsTab
  })

  const collectiblesScreen = tabScreen({
    name: 'Collectibles',
    Icon: IconCollectibles,
    component: CollectiblesTab
  })

  if (isArtist) {
    return (
      <TabNavigator>
        {trackScreen}
        {albumsScreen}
        {playlistsScreen}
        {repostsScreen}
        {showCollectiblesTab ? collectiblesScreen : null}
      </TabNavigator>
    )
  }

  return (
    <TabNavigator>
      {repostsScreen}
      {playlistsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </TabNavigator>
  )
}
