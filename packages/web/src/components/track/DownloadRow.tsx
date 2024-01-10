import { useCallback } from 'react'

import { CommonState, ID, cacheTracksSelectors } from '@audius/common'
import { Flex, IconReceive, PlainButton, Text } from '@audius/harmony'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'

const { getTrack } = cacheTracksSelectors

type DownloadRowProps = {
  trackId: ID
  onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
}

export const DownloadRow = ({ trackId, onDownload }: DownloadRowProps) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )

  const handleClick = useCallback(() => {
    if (track !== undefined && track?.track_id !== undefined) {
      onDownload(track.track_id, track.stem_of?.category, trackId)
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
        <Text>2</Text>
        <Flex direction='column' gap='xs'>
          <Text variant='body' strength='default'>
            {track?.stem_of?.category}
          </Text>
          <Text color='subdued' size='xs'>
            {track?.stem_of?.category}
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
