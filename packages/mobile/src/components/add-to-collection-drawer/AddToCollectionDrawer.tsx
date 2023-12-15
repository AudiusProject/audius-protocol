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
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Card } from 'app/components/card'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { useToast } from 'app/hooks/useToast'
import { makeStyles, shadow } from 'app/styles'

import { CollectionList } from '../collection-list'
import { AddCollectionCard } from '../collection-list/AddCollectionCard'
import type { ImageProps } from '../image/FastImage'

const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const { getTrackId, getTrackTitle, getTrackIsUnlisted } =
  addToCollectionUISelectors
const { getAccountWithOwnPlaylists } = accountSelectors
const { requestOpen: openDuplicateAddConfirmation } =
  duplicateAddConfirmationModalUIActions

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  hiddenAdd: 'You cannot add hidden tracks to a public playlist.'
}

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
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const isTrackUnlisted = useSelector(getTrackIsUnlisted)
  const user = useSelector(getAccountWithOwnPlaylists)

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

  const userPlaylists = user?.playlists ?? []

  const playlistTrackIdMap = useMemo(() => {
    const playlists = user?.playlists ?? []
    return playlists.reduce((acc, playlist) => {
      const trackIds = playlist.playlist_contents.track_ids.map((t) => t.track)
      acc[playlist.playlist_id] = trackIds
      return acc
    }, {})
  }, [user?.playlists])

  const addToNewPlaylist = useCallback(() => {
    const metadata = { playlist_name: trackTitle ?? 'New Playlist' }
    dispatch(
      createPlaylist(
        metadata,
        CreatePlaylistSource.FROM_TRACK,
        trackId,
        'toast'
      )
    )
    onClose()
  }, [dispatch, onClose, trackId, trackTitle])

  const renderCard = useCallback(
    ({ item }: { item: Collection | { _create: boolean } }) =>
      '_create' in item ? (
        <AddCollectionCard
          source={CreatePlaylistSource.FROM_TRACK}
          sourceTrackId={trackId}
          onCreate={addToNewPlaylist}
        />
      ) : (
        <Card
          style={{ opacity: isTrackUnlisted && !item.is_private ? 0.5 : 1 }}
          key={item.playlist_id}
          type='collection'
          id={item.playlist_id}
          primaryText={item.playlist_name}
          secondaryText={user?.name}
          onPress={() => {
            if (!trackId) return

            // Don't add if the track is hidden, but playlist is public
            if (isTrackUnlisted && !item.is_private) {
              toast({ content: messages.hiddenAdd })
              return
            }

            const doesPlaylistContainTrack =
              playlistTrackIdMap[item.playlist_id]?.includes(trackId)

            if (doesPlaylistContainTrack) {
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
      addToNewPlaylist,
      dispatch,
      isTrackUnlisted,
      onClose,
      playlistTrackIdMap,
      renderImage,
      toast,
      trackId,
      user?.name
    ]
  )

  if (!user || !trackId || !trackTitle) {
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
          collection={userPlaylists}
          showCreatePlaylistTile
          renderItem={renderCard}
        />
      </View>
    </AppDrawer>
  )
}
