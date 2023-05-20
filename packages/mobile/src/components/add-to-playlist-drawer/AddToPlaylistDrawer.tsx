import { useCallback } from 'react'

import {
  SquareSizes,
  CreatePlaylistSource,
  accountSelectors,
  cacheCollectionsActions,
  addToPlaylistUISelectors
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { useToast } from 'app/hooks/useToast'
import { makeStyles, shadow } from 'app/styles'

import type { ImageProps } from '../image/FastImage'

const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const { getTrackId, getTrackTitle } = addToPlaylistUISelectors
const { getAccountWithOwnPlaylists } = accountSelectors

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
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

export const AddToPlaylistDrawer = () => {
  const styles = useStyles()
  const { toast } = useToast()
  const dispatch = useDispatch()
  const { onClose } = useDrawerState('AddToPlaylist')
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
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

  if (!user || !trackId || !trackTitle) {
    return null
  }
  const userPlaylists = user.playlists ?? []

  const addToNewPlaylist = () => {
    const metadata = { playlist_name: trackTitle }
    dispatch(createPlaylist(metadata, CreatePlaylistSource.FROM_TRACK, trackId))
    toast({ content: messages.createdToast })
    onClose()
  }

  return (
    <AppDrawer
      modalName='AddToPlaylist'
      isFullscreen
      isGestureSupported={false}
      title={messages.title}
    >
      <View>
        <View style={styles.buttonContainer}>
          <Button
            title='Create New Playlist'
            onPress={addToNewPlaylist}
            containerStyle={styles.button}
            type={ButtonType.COMMON}
          />
        </View>
        <CardList
          contentContainerStyle={styles.cardList}
          data={userPlaylists}
          renderItem={({ item }) => (
            <Card
              key={item.playlist_id}
              type='collection'
              id={item.playlist_id}
              primaryText={item.playlist_name}
              secondaryText={user.name}
              onPress={() => {
                toast({ content: messages.addedToast })
                dispatch(addTrackToPlaylist(trackId!, item.playlist_id))
                onClose()
              }}
              renderImage={renderImage(item)}
            />
          )}
        />
      </View>
    </AppDrawer>
  )
}
