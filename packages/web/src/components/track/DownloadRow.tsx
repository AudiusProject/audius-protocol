import { useCallback } from 'react'

import {
  CommonState,
  ID,
  cacheTracksSelectors,
  DownloadQuality
} from '@audius/common'
import { Flex, IconReceive, PlainButton, Text } from '@audius/harmony'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track'
}

type DownloadRowProps = {
  trackId: ID
  quality: DownloadQuality
  onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
  index: number
}

export const DownloadRow = ({
  trackId,
  onDownload,
  index
}: DownloadRowProps) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )

  const handleClick = useCallback(() => {
    if (track) {
      onDownload(trackId, track.stem_of?.category, trackId)
    }
  }, [onDownload, track, trackId])

  return (
    <Flex
      p='l'
      borderTop='default'
      direction='row'
      alignItems='center'
      justifyContent='space-between'
    >
      <Flex gap='xl' alignItems='center'>
        <Text>{index}</Text>
        <Flex direction='column' gap='xs'>
          <Text variant='body' strength='default'>
            {track?.stem_of?.category ?? messages.fullTrack}
          </Text>
          <Text color='subdued' size='xs'>
            {track?.orig_filename}
          </Text>
        </Flex>
      </Flex>
      <Flex gap='2xl'>
        <Text>size</Text>
        <PlainButton onClick={handleClick}>
          <Icon icon={IconReceive} size='small' />
        </PlainButton>
      </Flex>
    </Flex>
  )
}
