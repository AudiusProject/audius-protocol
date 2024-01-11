import { useEffect } from 'react'

import {
  FeatureFlags,
  profilePageActions,
  profilePageSelectors,
  reachabilitySelectors,
  Status
} from '@audius/common'
import { useIsFocused } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { spacing } from 'app/styles/spacing'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { getIsOwner, useSelectProfile } from '../selectors'

const { getProfileAlbums, getCollectionsStatus } = profilePageSelectors
const { fetchCollections } = profilePageActions
const { getIsReachable } = reachabilitySelectors

const emptyAlbums = []

export const AlbumsTab = () => {
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )
  const { handle, album_count } = useSelectProfile(['handle', 'album_count'])
  const isReachable = useSelector(getIsReachable)
  const albums = useSelector((state) => getProfileAlbums(state, handle))
  const collectionsStatus = useSelector((state) =>
    getCollectionsStatus(state, handle)
  )
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const isFocused = useIsFocused()
  const dispatch = useDispatch()

  const shouldFetchAlbums =
    isFocused &&
    (album_count > 0 || isOwner) &&
    collectionsStatus === Status.IDLE

  useEffect(() => {
    if (shouldFetchAlbums) {
      dispatch(fetchCollections(handle))
    }
  }, [shouldFetchAlbums, dispatch, handle])

  return (
    <CollectionList
      collection={album_count > 0 || isOwner ? albums : emptyAlbums}
      collectionType='album'
      style={{ paddingTop: spacing(3) }}
      ListEmptyComponent={
        <EmptyProfileTile tab='albums' style={{ marginTop: 0 }} />
      }
      disableTopTabScroll
      showCreatePlaylistTile={!!isReachable && isOwner && isEditAlbumsEnabled}
      showsVerticalScrollIndicator={false}
      totalCount={album_count}
    />
  )
}
