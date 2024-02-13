import { useCallback, useEffect } from 'react'

import { DownloadQuality } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import {
  cacheTracksSelectors,
  tracksSocialActions,
  useWaitForDownloadModal
} from '@audius/common/store'
import { getDownloadFilename } from '@audius/common/utils'
import { css } from '@emotion/native'
import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  Divider,
  Flex,
  IconError,
  IconReceive,
  Paper,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony-native'
import Drawer from 'app/components/drawer'

import { getDownloadError } from 'app/store/download/selectors'
import LoadingSpinner from '../loading-spinner'
const { getTrack } = cacheTracksSelectors

const messages = {
  title: 'Downloading...',
  somethingWrong:
    'Something went wrong. Please check your connection and storage and try again.',
  tryAgain: 'Try again.'
}

/** This is very similar in implementation to `Hint`, but that component wraps children
 * in a `Text` component which doesn't allow us to get the layout we need.
 */
const DownloadError = ({ onRetry }: { onRetry: () => void }) => (
  <Paper
    role='alert'
    direction='column'
    gap='s'
    ph='l'
    pv='m'
    justifyContent='flex-start'
    backgroundColor='surface2'
    shadow='flat'
    border='strong'
  >
    <Flex direction='row' alignItems='center' gap='l'>
      <IconError size='l' color='default' />
      <Text variant='body' color='default' style={{ flexShrink: 1 }}>
        {messages.somethingWrong}
      </Text>
    </Flex>
    <Box pl='unit10'>
      <TextLink variant='visible' textVariant='body' onPress={onRetry}>
        {messages.tryAgain}
      </TextLink>
    </Box>
  </Paper>
)

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
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: parentTrackId ?? trackIds[0] })
  )
  const trackName =
    !parentTrackId && track?.orig_filename && track?.orig_filename?.length > 0
      ? getDownloadFilename({
          filename: track.orig_filename,
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
  }, [])
  useEffect(() => {
    performDownload()
  }, [])

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
        <Flex>
          {downloadError ? (
            <DownloadError onRetry={performDownload} />
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
