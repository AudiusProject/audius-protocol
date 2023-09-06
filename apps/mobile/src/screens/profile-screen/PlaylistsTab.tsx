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
import { spacing } from 'app/styles/spacing'

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

  const shouldFetchPlaylists =
    isFocused &&
    (playlist_count > 0 || isOwner) &&
    collectionsStatus === Status.IDLE

  useEffect(() => {
    if (shouldFetchPlaylists) {
      dispatch(fetchCollections(handle))
    }
  }, [shouldFetchPlaylists, dispatch, handle])

  return (
    <CollectionList
      collection={playlist_count > 0 || isOwner ? playlists : emptyPlaylists}
      style={{ paddingTop: spacing(3) }}
      ListEmptyComponent={
        <EmptyProfileTile tab='playlists' style={{ marginTop: 0 }} />
      }
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={playlist_count}
      showCreatePlaylistTile={isPlaylistUpdatesEnabled && isOwner}
      createPlaylistSource={CreatePlaylistSource.PROFILE_PAGE}
    />
  )
}
