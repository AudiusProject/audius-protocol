import type { CommonState } from '@audius/common/store'
import {
  cacheTracksSelectors,
  useWaitForDownloadModal
} from '@audius/common/store'
import { css } from '@emotion/native'
import { useSelector } from 'react-redux'

import {
  Divider,
  IconReceive,
  Text,
  Flex,
  useTheme
} from '@audius/harmony-native'
import Drawer from 'app/components/drawer'

import LoadingSpinner from '../loading-spinner'
const { getTrack } = cacheTracksSelectors

const messages = {
  title: 'Downloading...'
}

export const WaitForDownloadDrawer = () => {
  const {
    data: { contentId },
    isOpen,
    onClose,
    onClosed
  } = useWaitForDownloadModal()

  const { spacing } = useTheme()
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: contentId })
  )
  const trackName =
    track?.orig_filename && track?.orig_filename?.length > 0
      ? track.orig_filename
      : track?.title

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
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
          <LoadingSpinner
            style={{ width: spacing.unit7, height: spacing.unit7 }}
          />
        </Flex>
      </Flex>
    </Drawer>
  )
}
