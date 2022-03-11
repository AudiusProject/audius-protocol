import { useContext, useState } from 'react'

import { CreatePlaylistSource } from 'audius-client/src/common/models/Analytics'
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
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import Button, { ButtonType } from 'app/components/button'
import { Card } from 'app/components/card'
import { CardList } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { ToastContext } from 'app/components/toast/ToastContext'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
}

export const AddToPlaylistDrawer = () => {
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
      title={messages.title}
    >
      <View>
        <Shadow
          offset={[0, 1]}
          containerViewStyle={{ alignSelf: 'center', marginBottom: 16 }}
          viewStyle={{ borderRadius: 4 }}
          distance={3}
          startColor='rgba(133,129,153,0.11)'
        >
          <Button
            title='Create New Playlist'
            onPress={addToNewPlaylist}
            containerStyle={{ width: 256 }}
            type={ButtonType.COMMON}
          />
        </Shadow>
        <CardList
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={{ paddingBottom: 240 }}
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
