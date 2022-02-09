import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'

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
  profile: ProfileUser
}

export const ProfileTabNavigator = ({ profile }: ProfileTabNavigatiorProps) => {
  const isArtist = profile.track_count > 0

  const showCollectiblesTab = useShouldShowCollectiblesTab(profile)

  const trackScreen = tabScreen({
    name: 'tracks',
    Icon: IconNote,
    component: TracksTab
  })

  const albumsScreen = tabScreen({
    name: 'albums',
    Icon: IconAlbum,
    component: AlbumsTab
  })

  const playlistsScreen = tabScreen({
    name: 'playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
  })

  const repostsScreen = tabScreen({
    name: 'reposts',
    Icon: IconRepost,
    component: RepostsTab
  })

  const collectiblesScreen = tabScreen({
    name: 'collectibles',
    Icon: IconCollectibles,
    component: CollectiblesTab
  })

  if (isArtist) {
    return (
      <TabNavigator initialScreenName='tracks'>
        {trackScreen}
        {albumsScreen}
        {playlistsScreen}
        {repostsScreen}
        {showCollectiblesTab ? collectiblesScreen : null}
      </TabNavigator>
    )
  }

  return (
    <TabNavigator initialScreenName='reposts'>
      {repostsScreen}
      {playlistsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </TabNavigator>
  )
}
