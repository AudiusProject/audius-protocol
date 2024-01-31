import { useCallback } from 'react'

import {
  cacheCollectionsActions,
  publishPlaylistConfirmationModalUISelectors
} from '@audius/common/store'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconRocket from 'app/assets/images/iconRocket.svg'
import { Text, Button } from 'app/components/core'
import { useManualToast } from 'app/hooks/useManualToast'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import { useDrawerState } from '../drawer'
import Drawer from '../drawer/Drawer'
import LoadingSpinner from '../loading-spinner/LoadingSpinner'

const { publishPlaylist } = cacheCollectionsActions
const { getPlaylistId } = publishPlaylistConfirmationModalUISelectors

const messages = {
  drawerTitle: 'Make Public',
  drawerBody:
    'Are you sure you want to make this playlist public? It will be shared to your feed and your followers will be notified.',
  buttonConfirmText: 'Make Public',
  buttonCancelText: 'Cancel',
  publishingPlaylistText: 'Making public...'
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
  },
  toastContainer: {
    overflow: 'visible',
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4)
  },
  spinner: {
    height: 18,
    width: 18
  }
}))

export const PublishPlaylistDrawer = () => {
  const dispatch = useDispatch()
  const playlistId = useSelector(getPlaylistId)
  const neutral = useColor('neutral')
  const { toast } = useManualToast()
  const styles = useStyles()
  const { isOpen, onClose } = useDrawerState('PublishPlaylistConfirmation')

  const displayPublishToast = useCallback(() => {
    const publishingPlaylistToastContent = (
      <View style={styles.toastContainer}>
        <LoadingSpinner style={styles.spinner} color='white' />
        <Text color='white' weight='demiBold' style={{ alignSelf: 'center' }}>
          {messages.publishingPlaylistText}
        </Text>
      </View>
    )

    return toast({ content: publishingPlaylistToastContent })
  }, [toast, styles])

  const handlePublish = useCallback(() => {
    if (playlistId) {
      const { key: dismissToastKey } = displayPublishToast()
      dispatch(publishPlaylist(playlistId, dismissToastKey))
      onClose()
    }
  }, [dispatch, onClose, playlistId, displayPublishToast])

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.title}>
          <IconRocket fill={neutral} width={24} height={24} />
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
          {messages.drawerBody}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title={messages.buttonConfirmText}
            variant='primary'
            size='large'
            iconPosition='left'
            icon={IconRocket}
            styles={{ icon: { height: 24, width: 24 } }}
            fullWidth
            onPress={handlePublish}
          />
          <Button
            title={messages.buttonCancelText}
            variant='common'
            size='large'
            fullWidth
            onPress={onClose}
          />
        </View>
      </View>
    </Drawer>
  )
}
