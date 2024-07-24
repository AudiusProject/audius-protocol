import { useCallback, useEffect, useState } from 'react'

import {
  cacheCollectionsActions,
  trackPageActions,
  cacheTracksSelectors,
  toastActions,
  usePublishContentModal
} from '@audius/common/store'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { IconRocket, Button } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { useManualToast } from 'app/hooks/useManualToast'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import Drawer from '../drawer/Drawer'
import LoadingSpinner from '../loading-spinner/LoadingSpinner'

const { publishPlaylist } = cacheCollectionsActions
const { makeTrackPublic } = trackPageActions
const { getTrack } = cacheTracksSelectors
const { manualClearToast } = toastActions

const messages = {
  drawerTitle: 'Make Public',
  drawerBody: (type: 'playlist' | 'album' | 'track') =>
    `Ready to release your new ${type}? Your followers will be notified and your ${type} will be released to the public.`,
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

export const PublishContentDrawer = () => {
  const dispatch = useDispatch()
  const neutral = useColor('neutral')
  const { toast } = useManualToast()
  const styles = useStyles()
  const {
    isOpen,
    onClose,
    data: { contentId, contentType }
  } = usePublishContentModal()
  const [dismissToastKey, setDismissToastKey] = useState<string | undefined>()
  const currentTrack = useSelector((state) =>
    getTrack(state, { id: contentId })
  )

  const previousIsPublishingTrack = usePrevious(currentTrack?._is_publishing)

  // (Tracks only) - Check for changes to is_publishing to dismiss the toast
  useEffect(() => {
    if (
      dismissToastKey &&
      contentType === 'track' &&
      previousIsPublishingTrack === true &&
      currentTrack?._is_publishing === false
    ) {
      dispatch(manualClearToast({ key: dismissToastKey }))
    }
  }, [
    contentType,
    currentTrack,
    currentTrack?._is_publishing,
    dismissToastKey,
    dispatch,
    previousIsPublishingTrack
  ])

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
  }, [styles.toastContainer, styles.spinner, toast])

  const handlePublish = useCallback(() => {
    // Publish playlist
    const { key: dismissToastKey } = displayPublishToast()
    setDismissToastKey(dismissToastKey)

    if (contentId && (contentType === 'playlist' || contentType === 'album')) {
      dispatch(publishPlaylist(contentId, dismissToastKey))
    }
    // Publish track
    if (contentId && contentType === 'track') {
      dispatch(makeTrackPublic(contentId))
    }
    onClose()
  }, [contentId, contentType, displayPublishToast, dispatch, onClose])

  // Content type should never be null but would cause issues if we continued with it null
  // The types allow null solely for the default store state use case
  if (contentType === null) {
    return null
  }

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
          {messages.drawerBody(contentType)}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            variant='primary'
            iconLeft={IconRocket}
            fullWidth
            onPress={handlePublish}
          >
            {messages.buttonConfirmText}
          </Button>
          <Button variant='secondary' fullWidth onPress={onClose}>
            {messages.buttonCancelText}
          </Button>
        </View>
      </View>
    </Drawer>
  )
}
