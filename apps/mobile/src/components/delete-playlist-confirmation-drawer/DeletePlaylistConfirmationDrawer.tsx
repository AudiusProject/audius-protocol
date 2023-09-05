import { useCallback } from 'react'

import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  deletePlaylistConfirmationModalUISelectors,
  fillString
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconTrash from 'app/assets/images/iconTrash.svg'
import { Text, Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import { useDrawerState } from '../drawer'
import Drawer from '../drawer/Drawer'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions
const { getCollection } = cacheCollectionsSelectors

const messages = {
  drawerTitle: 'Delete Playlist?',
  drawerBody: 'Are you sure you want to delete your playlist%0?',
  buttonConfirmText: 'Delete',
  buttonCancelText: 'Cancel'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  title: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(2),
    alignItems: 'center',
    paddingVertical: spacing(6),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  titleText: {
    textTransform: 'uppercase'
  },
  container: {
    marginHorizontal: spacing(4)
  },
  body: {
    margin: spacing(4),
    lineHeight: spacing(6),
    textAlign: 'center'
  },
  buttonContainer: {
    gap: spacing(2),
    marginBottom: spacing(8)
  }
}))

export const DeletePlaylistConfirmationDrawer = () => {
  const playlistId = useSelector(getPlaylistId)
  const playlist = useSelector((state) =>
    getCollection(state, { id: playlistId })
  )
  const neutral = useColor('neutral')
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const styles = useStyles()
  const { isOpen, onClose } = useDrawerState('DeletePlaylistConfirmation')

  const handleDelete = useCallback(() => {
    if (playlistId) {
      dispatch(deletePlaylist(playlistId))
      navigation.goBack()
    }
    onClose()
  }, [dispatch, playlistId, navigation, onClose])

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.title}>
          <IconTrash fill={neutral} width={24} height={24} />
          <Text
            weight='heavy'
            color='neutral'
            fontSize='xl'
            style={styles.titleText}
          >
            {messages.drawerTitle}
          </Text>
        </View>
        <Text style={styles.body} fontSize='large' weight='medium'>
          {fillString(
            messages.drawerBody,
            playlist ? `, ${playlist.playlist_name}` : ''
          )}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title={messages.buttonCancelText}
            variant='primary'
            size='large'
            fullWidth
            onPress={onClose}
          />
          <Button
            title={messages.buttonConfirmText}
            variant='common'
            size='large'
            fullWidth
            onPress={handleDelete}
          />
        </View>
      </View>
    </Drawer>
  )
}
