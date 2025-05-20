import { useCallback, useMemo, useState } from 'react'

import {
  useCurrentAccount,
  selectNameSortedPlaylistsAndAlbums,
  useCurrentAccountUser,
  useCollections
} from '@audius/common/api'
import type { Collection } from '@audius/common/models'
import { CreatePlaylistSource } from '@audius/common/models'
import {
  cacheCollectionsActions,
  addToCollectionUISelectors,
  duplicateAddConfirmationModalUIActions
} from '@audius/common/store'
import { fuzzySearch } from '@audius/common/utils'
import { fetchAccountCollections } from 'common/store/saved-collections/actions'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'

import { CollectionList } from '../collection-list'
import { AddCollectionCard } from '../collection-list/AddCollectionCard'
import { CollectionCard } from '../collection-list/CollectionCard'
import { FilterInput } from '../filter-input'

const { addTrackToPlaylist, createAlbum, createPlaylist } =
  cacheCollectionsActions
const { getTrackId, getTrackTitle, getCollectionType } =
  addToCollectionUISelectors
const { requestOpen: openDuplicateAddConfirmation } =
  duplicateAddConfirmationModalUIActions

const getMessages = (collectionType: 'album' | 'playlist') => ({
  title: `Add To ${capitalize(collectionType)}`,
  addedToast: `Added To ${capitalize(collectionType)}!`,
  newCollection: `New ${capitalize(collectionType)}`,
  hiddenAdd: `You cannot add hidden tracks to a public ${collectionType}.`,
  tracks: (count: number) => `${count} track${count === 1 ? '' : 's'}`,
  filterPlaceholder: 'Find one of your playlists'
})

const useStyles = makeStyles(() => ({
  cardList: {
    paddingBottom: 240
  }
}))

export const AddToCollectionDrawer = () => {
  const styles = useStyles()
  const { toast } = useToast()
  const dispatch = useDispatch()
  const { onClose } = useDrawerState('AddToCollection')
  const collectionType = useSelector(getCollectionType)
  const isAlbumType = collectionType === 'album'
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const [filter, setFilter] = useState('')

  const { data: nameSortedPlaylistsAndAlbums } = useCurrentAccount({
    select: (account) => selectNameSortedPlaylistsAndAlbums(account)
  })
  const { data: currentUser } = useCurrentAccountUser()

  const accountCollectionsToAddTo = useMemo(() => {
    if (!nameSortedPlaylistsAndAlbums) return []
    const collections =
      collectionType === 'album'
        ? nameSortedPlaylistsAndAlbums.albums
        : nameSortedPlaylistsAndAlbums.playlists
    const userCollections = collections.filter(
      (collection) => collection.user.id === currentUser?.user_id
    )
    return filter
      ? fuzzySearch(filter, userCollections, 3, (collection) => collection.name)
      : userCollections
  }, [nameSortedPlaylistsAndAlbums, collectionType, currentUser, filter])
  const { data: fullCollectionsToAddTo } = useCollections(
    accountCollectionsToAddTo.map((c) => c.id)
  )

  const messages = getMessages(collectionType)

  useEffectOnce(() => {
    dispatch(fetchAccountCollections())
  })

  const handleAddToNewCollection = useCallback(() => {
    const metadata = {
      playlist_name: trackTitle ?? messages.newCollection
    }
    dispatch(
      (isAlbumType ? createAlbum : createPlaylist)(
        metadata,
        CreatePlaylistSource.FROM_TRACK,
        trackId,
        'toast'
      )
    )
    onClose()
  }, [
    dispatch,
    isAlbumType,
    messages.newCollection,
    onClose,
    trackId,
    trackTitle
  ])

  const renderCard = useCallback(
    ({ item }: { item: Collection | { _create: boolean } }) =>
      '_create' in item ? (
        <AddCollectionCard
          source={CreatePlaylistSource.FROM_TRACK}
          sourceTrackId={trackId}
          onCreate={handleAddToNewCollection}
          collectionType={collectionType}
        />
      ) : (
        <CollectionCard
          key={item.playlist_id}
          id={item.playlist_id}
          noNavigation
          onPress={() => {
            if (!trackId) return

            const doesCollectionContainTrack =
              item.playlist_contents.track_ids.some(
                (track) => track.track === trackId
              )

            if (doesCollectionContainTrack) {
              dispatch(
                openDuplicateAddConfirmation({
                  playlistId: item.playlist_id,
                  trackId
                })
              )
            } else {
              toast({ content: messages.addedToast })
              dispatch(addTrackToPlaylist(trackId, item.playlist_id))
            }
            onClose()
          }}
        />
      ),
    [
      trackId,
      handleAddToNewCollection,
      collectionType,
      messages,
      onClose,
      toast,
      dispatch
    ]
  )

  if (!trackId || !trackTitle) {
    return null
  }

  return (
    <AppDrawer
      modalName='AddToCollection'
      isFullscreen
      isGestureSupported={false}
      title={messages.title}
    >
      <View>
        <CollectionList
          ListHeaderComponent={
            <FilterInput
              placeholder={messages.filterPlaceholder}
              onChangeText={setFilter}
            />
          }
          contentContainerStyle={styles.cardList}
          collection={fullCollectionsToAddTo}
          showCreateCollectionTile
          renderItem={renderCard}
        />
      </View>
    </AppDrawer>
  )
}
