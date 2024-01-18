import { useCallback } from 'react'

import {
  cacheTracksSelectors,
  useDownloadableContentAccess
} from '@audius/common'
import type { DownloadQuality, CommonState, ID } from '@audius/common'
import { css } from '@emotion/native'
import { useSelector } from 'react-redux'

import { Flex, Text, IconReceive, Box } from '@audius/harmony-native'
import { PlainButton } from 'app/harmony-native/components/Button/PlainButton/PlainButton'
import { useToast } from 'app/hooks/useToast'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  trackId: ID
  quality: DownloadQuality
  // onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
  hideDownload?: boolean
  index: number
}

export const DownloadRow = ({
  trackId,
  // onDownload,
  hideDownload,
  index
}: DownloadRowProps) => {
  const { toast } = useToast()
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { shouldDisplayDownloadFollowGated } = useDownloadableContentAccess({
    trackId
  })

  const handlePress = useCallback(() => {
    if (shouldDisplayDownloadFollowGated) {
      toast({ content: messages.followToDownload })
    } else if (track && track.access.download) {
      // onDownload(trackId, track.stem_of?.category, trackId)
    }
  }, [shouldDisplayDownloadFollowGated, toast, track])

  return (
    <Flex
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      borderTop='default'
      pv='m'
      ph='l'
    >
      <Flex
        direction='row'
        gap='xl'
        alignItems='center'
        justifyContent='space-between'
        style={css({ flexShrink: 1 })}
      >
        <Text variant='body' color='subdued'>
          {index}
        </Text>
        <Flex gap='xs' style={css({ flexShrink: 1 })}>
          <Text variant='body'>
            {track?.stem_of?.category ?? messages.fullTrack}
          </Text>
          <Text
            variant='body'
            color='subdued'
            ellipsizeMode='tail'
            numberOfLines={1}
          >
            {track?.orig_filename}
          </Text>
        </Flex>
      </Flex>
      {hideDownload ? null : (
        <PlainButton onPress={handlePress}>
          <Box ph='s' pv='m'>
            <IconReceive color='subdued' size='s' />
          </Box>
        </PlainButton>
      )}
    </Flex>
  )
}
