import { useEffect } from 'react'

import {
  profilePageActions,
  profilePageSelectors,
  Status
} from '@audius/common'
import { useIsFocused } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
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
  const isFocused = useIsFocused()
  const dispatch = useDispatch()

  useEffect(() => {
    if (isFocused && playlist_count > 0 && collectionsStatus === Status.IDLE) {
      dispatch(fetchCollections(handle))
    }
  }, [isFocused, playlist_count, collectionsStatus, dispatch, handle])

  return (
    <CollectionList
      collection={playlist_count > 0 ? playlists : emptyPlaylists}
      ListEmptyComponent={<EmptyProfileTile tab='playlists' />}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={playlist_count}
    />
  )
}
