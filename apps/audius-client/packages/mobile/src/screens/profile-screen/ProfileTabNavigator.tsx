import { ReactNode } from 'react'

import { Animated } from 'react-native'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconCollectibles from 'app/assets/images/iconCollectibles.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import {
  collapsibleTabScreen,
  CollapsibleTabNavigator
} from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'

import { AlbumsTab } from './AlbumsTab'
import { CollectiblesTab } from './CollectiblesTab'
import { PlaylistsTab } from './PlaylistsTab'
import { RepostsTab } from './RepostsTab'
import { TracksTab } from './TracksTab'
import { useSelectProfile } from './selectors'
import { useShouldShowCollectiblesTab } from './utils'

type ProfileTabNavigatorProps = {
  /**
   * Function that renders the collapsible header
   */
  renderHeader: () => ReactNode

  /**
   * Animated value to capture scrolling. If unset, an
   * animated value is created.
   */
  animatedValue?: Animated.Value
}

export const ProfileTabNavigator = ({
  renderHeader,
  animatedValue
}: ProfileTabNavigatorProps) => {
  const { user_id, track_count } = useSelectProfile(['user_id', 'track_count'])
  const { params } = useRoute<'Profile'>()

  const initialParams = { id: user_id, handle: params.handle }

  const isArtist = track_count > 0

  const showCollectiblesTab = useShouldShowCollectiblesTab()

  const trackScreen = collapsibleTabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab,
    initialParams
  })

  const albumsScreen = collapsibleTabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams
  })

  const playlistsScreen = collapsibleTabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab,
    initialParams
  })

  const repostsScreen = collapsibleTabScreen({
    name: 'Reposts',
    Icon: IconRepost,
    component: RepostsTab,
    initialParams
  })

  const collectiblesScreen = collapsibleTabScreen({
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
      <CollapsibleTabNavigator
        renderHeader={renderHeader}
        animatedValue={animatedValue}
        screenOptions={screenOptions}
      >
        {trackScreen}
        {albumsScreen}
        {playlistsScreen}
        {repostsScreen}
        {showCollectiblesTab ? collectiblesScreen : null}
      </CollapsibleTabNavigator>
    )
  }

  return (
    <CollapsibleTabNavigator
      renderHeader={renderHeader}
      animatedValue={animatedValue}
      screenOptions={screenOptions}
    >
      {repostsScreen}
      {playlistsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </CollapsibleTabNavigator>
  )
}
