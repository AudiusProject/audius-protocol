import { useContext } from 'react'

import {
  CreatePlaylistSource,
  accountSelectors,
  cacheCollectionsActions,
  addToPlaylistUISelectors,
  newCollectionMetadata
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { getTempPlaylistId } from 'utils/tempPlaylistId'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { ToastContext } from 'app/components/toast/ToastContext'
import { makeStyles, shadow } from 'app/styles'
const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const { getTrackId, getTrackTitle } = addToPlaylistUISelectors
const getAccountWithOwnPlaylists = accountSelectors.getAccountWithOwnPlaylists

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
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const { onClose } = useDrawerState('AddToPlaylist')
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const user = useSelector(getAccountWithOwnPlaylists)

  if (!user || !trackId || !trackTitle) {
    return null
  }
  const userPlaylists = user.playlists ?? []

  const addToNewPlaylist = () => {
    const metadata = newCollectionMetadata({
      playlist_name: trackTitle,
      is_private: false
    })
    const tempId = getTempPlaylistId()
    dispatch(
      createPlaylist(tempId, metadata, CreatePlaylistSource.FROM_TRACK, trackId)
    )
    dispatch(addTrackToPlaylist(trackId!, tempId))
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
              id={item.playlist_id}
              type='collection'
              imageSize={item._cover_art_sizes}
              primaryText={item.playlist_name}
              secondaryText={user.name}
              onPress={() => {
                toast({ content: messages.addedToast })
                dispatch(addTrackToPlaylist(trackId!, item.playlist_id))
                onClose()
              }}
              user={user}
            />
          )}
        />
      </View>
    </AppDrawer>
  )
}
