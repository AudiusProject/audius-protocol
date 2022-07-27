import { useContext, useState } from 'react'

import { CreatePlaylistSource } from '@audius/common'
import { getAccountWithOwnPlaylists } from 'audius-client/src/common/store/account/selectors'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'audius-client/src/common/store/cache/collections/actions'
import {
  getTrackId,
  getTrackTitle
} from 'audius-client/src/common/store/ui/add-to-playlist/selectors'
import { newCollectionMetadata } from 'audius-client/src/schemas'
import { FEED_PAGE, playlistPage } from 'audius-client/src/utils/route'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { View } from 'react-native'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { ToastContext } from 'app/components/toast/ToastContext'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles, shadow } from 'app/styles'

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
  const dispatchWeb = useDispatchWeb()
  const pushRouteWeb = usePushRouteWeb()
  const { onClose } = useDrawerState('AddToPlaylist')
  const trackId = useSelectorWeb(getTrackId)
  const trackTitle = useSelectorWeb(getTrackTitle)
  const user = useSelectorWeb(getAccountWithOwnPlaylists)
  const [isDrawerGestureSupported, setIsDrawerGestureSupported] = useState(true)

  if (!user || !trackId || !trackTitle) {
    return null
  }
  const userPlaylists = user.playlists ?? []

  const addToNewPlaylist = () => {
    const metadata = newCollectionMetadata({
      playlist_name: trackTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatchWeb(
      createPlaylist(tempId, metadata, CreatePlaylistSource.FROM_TRACK, trackId)
    )
    dispatchWeb(addTrackToPlaylist(trackId!, tempId))
    toast({ content: messages.createdToast })
    pushRouteWeb(playlistPage(user.handle, trackTitle, tempId), FEED_PAGE)
    onClose()
  }

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { y } = e.nativeEvent.contentOffset

    if (isDrawerGestureSupported && y > 0) {
      setIsDrawerGestureSupported(false)
    } else if (!isDrawerGestureSupported && y <= 0) {
      setIsDrawerGestureSupported(true)
    }
  }

  return (
    <AppDrawer
      modalName='AddToPlaylist'
      isFullscreen
      isGestureSupported={isDrawerGestureSupported}
      title={messages.title}>
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
          onScrollEndDrag={handleScrollEnd}
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
                dispatchWeb(addTrackToPlaylist(trackId!, item.playlist_id))
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
