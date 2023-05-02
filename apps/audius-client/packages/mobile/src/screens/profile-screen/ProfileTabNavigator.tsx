import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { accountActions, accountSelectors } from '@audius/common'
import type { Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

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

const { fetchHasTracks } = accountActions
const { getUserId, getUserHandle, getAccountHasTracks } = accountSelectors

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
  const { user_id, track_count } = useSelectProfile(['user_id', 'track_count'])
  const { params } = useRoute<'Profile'>()

  const initialParams = { id: user_id, handle: params.handle }

  const accountHasTracks = useSelector(getAccountHasTracks)
  const isArtist = accountHasTracks || track_count > 0

  const currentUserId = useSelector(getUserId)
  const currentUserHandle = useSelector(getUserHandle)
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      currentUserId === initialParams.id ||
      currentUserHandle === initialParams.handle
    ) {
      dispatch(fetchHasTracks())
    }
  }, [
    currentUserHandle,
    currentUserId,
    dispatch,
    initialParams.handle,
    initialParams.id
  ])

  const showCollectiblesTab = useShouldShowCollectiblesTab()

  const trackScreen = collapsibleTabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const albumsScreen = collapsibleTabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const playlistsScreen = collapsibleTabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab,
    initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const repostsScreen = collapsibleTabScreen({
    name: 'Reposts',
    Icon: IconRepost,
    component: RepostsTab,
    initialParams: isArtist ? { ...initialParams, lazy: true } : initialParams,
    refreshing,
    onRefresh,
    scrollY: animatedValue
  })

  const collectiblesScreen = collapsibleTabScreen({
    name: 'Collectibles',
    Icon: IconCollectibles,
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
