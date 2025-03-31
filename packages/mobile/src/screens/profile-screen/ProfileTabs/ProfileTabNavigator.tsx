import type { ReactNode } from 'react'

import { ProfilePageTabs } from '@audius/common/store'
import type { Animated } from 'react-native'

import {
  IconAlbum,
  IconCollectible,
  IconNote,
  IconPlaylists,
  IconRepost
} from '@audius/harmony-native'
import {
  collapsibleTabScreen,
  CollapsibleTabNavigator
} from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'

import { useSelectProfile } from '../selectors'
import { useIsArtist } from '../useIsArtist'
import { useShouldShowCollectiblesTab } from '../utils'

import { AlbumsTab } from './AlbumsTab'
import { CollectiblesTab } from './CollectiblesTab'
import { PlaylistsTab } from './PlaylistsTab'
import { RepostsTab } from './RepostsTab'
import { TracksTab } from './TracksTab'

// Height of a typical profile header
const INITIAL_PROFILE_HEADER_HEIGHT = 1081

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

  refreshing?: boolean
  onRefresh?: () => void
}

export const ProfileTabNavigator = ({
  renderHeader,
  animatedValue,
  refreshing,
  onRefresh
}: ProfileTabNavigatorProps) => {
  const { user_id } = useSelectProfile(['user_id'])
  const { params } = useRoute<'Profile'>()

  const initialParams = { id: user_id, handle: params.handle }
  const isArtist = useIsArtist()

  const showCollectiblesTab = useShouldShowCollectiblesTab()

  const trackScreen = collapsibleTabScreen({
    name: ProfilePageTabs.TRACKS,
    Icon: IconNote,
    component: TracksTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const albumsScreen = collapsibleTabScreen({
    name: ProfilePageTabs.ALBUMS,
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const playlistsScreen = collapsibleTabScreen({
    name: ProfilePageTabs.PLAYLISTS,
    Icon: IconPlaylists,
    component: PlaylistsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const repostsScreen = collapsibleTabScreen({
    name: ProfilePageTabs.REPOSTS,
    Icon: IconRepost,
    component: RepostsTab,
    initialParams: isArtist ? { ...initialParams, lazy: true } : initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const collectiblesScreen = collapsibleTabScreen({
    name: ProfilePageTabs.COLLECTIBLES,
    Icon: IconCollectible,
    component: CollectiblesTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  if (isArtist) {
    return (
      <CollapsibleTabNavigator
        renderHeader={renderHeader}
        animatedValue={animatedValue}
        headerHeight={INITIAL_PROFILE_HEADER_HEIGHT}
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
      headerHeight={INITIAL_PROFILE_HEADER_HEIGHT}
    >
      {repostsScreen}
      {playlistsScreen}
      {showCollectiblesTab ? collectiblesScreen : null}
    </CollapsibleTabNavigator>
  )
}
