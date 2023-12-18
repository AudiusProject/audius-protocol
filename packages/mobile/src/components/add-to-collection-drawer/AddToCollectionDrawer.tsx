import { useCallback, useMemo } from 'react'

import type { Collection } from '@audius/common'
import {
  duplicateAddConfirmationModalUIActions,
  SquareSizes,
  CreatePlaylistSource,
  accountSelectors,
  cacheCollectionsActions,
  addToCollectionUISelectors
} from '@audius/common'
import { fetchAccountCollections } from 'common/store/saved-collections/actions'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { Card } from 'app/components/card'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { useToast } from 'app/hooks/useToast'
import { makeStyles, shadow } from 'app/styles'

import { CollectionList } from '../collection-list'
import { AddCollectionCard } from '../collection-list/AddCollectionCard'
import type { ImageProps } from '../image/FastImage'

const { addTrackToPlaylist, createAlbum, createPlaylist } =
  cacheCollectionsActions
const { getTrackId, getTrackTitle, getTrackIsUnlisted, getCollectionType } =
  addToCollectionUISelectors
const { getAccountWithNameSortedPlaylistsAndAlbums } = accountSelectors
const { requestOpen: openDuplicateAddConfirmation } =
  duplicateAddConfirmationModalUIActions

const getMessages = (collectionType: 'album' | 'playlist') => ({
  title: `Add To ${capitalize(collectionType)}`,
  addedToast: `Added To ${capitalize(collectionType)}!`,
  newCollection: `New ${capitalize(collectionType)}`,
  hiddenAdd: `You cannot add hidden tracks to a public ${collectionType}.`
})

const useStyles = makeStyles(() => ({
  buttonContainer: {
    alignSelf: 'center',
    borderRadius: 4,
    marginBottom: 16,
    ...shadow()
  },
  button: {
    width: 256
  },
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
  const isTrackUnlisted = useSelector(getTrackIsUnlisted)
  const account = useSelector(getAccountWithNameSortedPlaylistsAndAlbums)

  const messages = getMessages(collectionType)

  useEffectOnce(() => {
    dispatch(fetchAccountCollections())
  })

  const renderImage = useCallback(
    (item) => (props?: ImageProps) =>
      (
        <CollectionImage
          collection={item}
          size={SquareSizes.SIZE_480_BY_480}
          {...props}
        />
      ),
    []
  )

  const filteredCollections =
    (isAlbumType ? account?.albums : account?.playlists) ?? []

  const collectionTrackIdMap = useMemo(() => {
    const collections =
      (isAlbumType ? account?.albums : account?.playlists) ?? []
    return collections.reduce((acc, playlist) => {
      const trackIds = playlist.playlist_contents.track_ids.map((t) => t.track)
      acc[playlist.playlist_id] = trackIds
      return acc
    }, {})
  }, [account?.albums, account?.playlists, isAlbumType])

  const addToNewCollection = useCallback(() => {
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
          onCreate={addToNewCollection}
          collectionType={collectionType}
        />
      ) : (
        <Card
          style={{ opacity: isTrackUnlisted && !item.is_private ? 0.5 : 1 }}
          key={item.playlist_id}
          type='collection'
          id={item.playlist_id}
          primaryText={item.playlist_name}
          secondaryText={account?.name}
          onPress={() => {
            if (!trackId) return

            // Don't add if the track is hidden, but collection is public
            if (isTrackUnlisted && !item.is_private) {
              toast({ content: messages.hiddenAdd })
              return
            }

            const doesCollectionContainTrack =
              collectionTrackIdMap[item.playlist_id]?.includes(trackId)

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
          renderImage={renderImage(item)}
        />
      ),
    [
      trackId,
      addToNewCollection,
      isTrackUnlisted,
      account?.name,
      renderImage,
      collectionTrackIdMap,
      onClose,
      toast,
      messages.hiddenAdd,
      messages.addedToast,
      dispatch
    ]
  )

  if (!account || !trackId || !trackTitle) {
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
          contentContainerStyle={styles.cardList}
          collection={filteredCollections}
          showCreatePlaylistTile
          renderItem={renderCard}
        />
      </View>
    </AppDrawer>
  )
}
