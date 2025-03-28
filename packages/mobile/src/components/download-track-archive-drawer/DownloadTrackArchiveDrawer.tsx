import { useCallback, useEffect } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import { DownloadQuality } from '@audius/common/models'
import {
  tracksSocialActions,
  useWaitForDownloadModal,
  downloadsSelectors
} from '@audius/common/store'
import { getFilename } from '@audius/common/utils'
import { css } from '@emotion/native'
import { useDispatch, useSelector } from 'react-redux'

import {
  Divider,
  Flex,
  Hint,
  IconError,
  IconReceive,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony-native'
import Drawer from 'app/components/drawer'

import LoadingSpinner from '../loading-spinner'
const { getDownloadError } = downloadsSelectors

const messages = {
  title: 'Downloading...',
  somethingWrong:
    'Something went wrong. Please check your connection and storage and try again.',
  tryAgain: 'Try again.'
}

export const WaitForDownloadDrawer = () => {
  const dispatch = useDispatch()
  const {
    data: { parentTrackId, trackIds, quality },
    isOpen,
    onClose,
    onClosed
  } = useWaitForDownloadModal()

  const downloadError = useSelector(getDownloadError)

  const { spacing } = useTheme()
  const { data: track } = useTrack(parentTrackId ?? trackIds[0])
  const { data: user } = useUser(track?.owner_id)
  const trackName =
    !parentTrackId &&
    user &&
    track?.orig_filename &&
    track?.orig_filename?.length > 0
      ? getFilename({
          track,
          user,
          isOriginal: quality === DownloadQuality.ORIGINAL
        })
      : track?.title

  const handleClosed = useCallback(() => {
    dispatch(tracksSocialActions.cancelDownloads())
    onClosed()
  }, [onClosed, dispatch])

  const performDownload = useCallback(() => {
    dispatch(
      tracksSocialActions.downloadTrack({
        trackIds,
        parentTrackId,
        original: quality === DownloadQuality.ORIGINAL
      })
    )
  }, [parentTrackId, trackIds, quality, dispatch])

  useEffect(() => {
    performDownload()
  }, [performDownload])

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={handleClosed}>
      <Flex p='xl' gap='xl' alignItems='center'>
        <Flex direction='row' gap='s' justifyContent='center'>
          <IconReceive color='default' />
          <Text
            variant='label'
            strength='strong'
            size='xl'
            color='default'
            style={css({ textTransform: 'uppercase' })}
          >
            {messages.title}
          </Text>
        </Flex>
        <Flex style={css({ width: '100%' })}>
          <Divider orientation='horizontal' />
        </Flex>
        <Flex>
          <Text variant='body' size='l' strength='strong'>
            {trackName}
          </Text>
        </Flex>
        <Flex ph='l'>
          {downloadError ? (
            <Hint
              icon={IconError}
              actions={
                <TextLink variant='visible' onPress={performDownload}>
                  {messages.tryAgain}
                </TextLink>
              }
            >
              {messages.somethingWrong}
            </Hint>
          ) : (
            <LoadingSpinner
              style={{ width: spacing.unit7, height: spacing.unit7 }}
            />
          )}
        </Flex>
      </Flex>
    </Drawer>
  )
}
