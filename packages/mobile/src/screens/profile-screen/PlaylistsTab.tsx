import { useEffect } from 'react'

import {
  CreatePlaylistSource,
  FeatureFlags,
  profilePageActions,
  profilePageSelectors,
  Status
} from '@audius/common'
import { useIsFocused } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import { EmptyProfileTile } from './EmptyProfileTile'
import { getIsOwner, useSelectProfile } from './selectors'
const { getProfilePlaylists, getCollectionsStatus } = profilePageSelectors
const { fetchCollections } = profilePageActions

const emptyPlaylists = []

export const PlaylistsTab = () => {
  const { handle, playlist_count } = useSelectProfile([
    'handle',
    'playlist_count'
  ])
  const playlists = useSelector((state) => getProfilePlaylists(state, handle))
  const collectionsStatus = useSelector((state) =>
    getCollectionsStatus(state, handle)
  )
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const isFocused = useIsFocused()
  const dispatch = useDispatch()
  const { isEnabled: isPlaylistUpdatesEnabled } = useFeatureFlag(
    FeatureFlags.PLAYLIST_UPDATES_POST_QA
  )

  useEffect(() => {
    if (isFocused && playlist_count > 0 && collectionsStatus === Status.IDLE) {
      dispatch(fetchCollections(handle))
    }
  }, [isFocused, playlist_count, collectionsStatus, dispatch, handle])

  return (
    <CollectionList
      collection={playlist_count > 0 ? playlists : emptyPlaylists}
      style={{ paddingTop: playlist_count > 0 ? 12 : 0 }}
      ListEmptyComponent={<EmptyProfileTile tab='playlists' />}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={playlist_count}
      showCreatePlaylistTile={isPlaylistUpdatesEnabled && isOwner}
      createPlaylistSource={CreatePlaylistSource.PROFILE_PAGE}
    />
  )
}
