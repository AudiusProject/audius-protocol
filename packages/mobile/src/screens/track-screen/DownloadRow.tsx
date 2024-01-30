import { useCallback } from 'react'

import type { CommonState } from '@audius/common'
import { cacheTracksSelectors, tracksSocialActions } from '@audius/common'
import { useDownloadableContentAccess } from '@audius/common/hooks'
import { Name, DownloadQuality } from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { css } from '@emotion/native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, Text, IconReceive, Box } from '@audius/harmony-native'
import { PlainButton } from 'app/harmony-native/components/Button/PlainButton/PlainButton'
import { useToast } from 'app/hooks/useToast'
import { make, track as trackAnalytics } from 'app/services/analytics'

const { getTrack } = cacheTracksSelectors
const { downloadTrack } = tracksSocialActions

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  trackId: ID
  parentTrackId?: ID
  quality: DownloadQuality
  hideDownload?: boolean
  index: number
}

export const DownloadRow = ({
  trackId,
  parentTrackId,
  quality,
  hideDownload,
  index
}: DownloadRowProps) => {
  const dispatch = useDispatch()
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
      dispatch(
        downloadTrack(
          trackId,
          track.stem_of?.category,
          quality === DownloadQuality.ORIGINAL
        )
      )
      trackAnalytics(
        make({
          eventName: Name.TRACK_PAGE_DOWNLOAD,
          id: trackId,
          category: track.stem_of?.category,
          parent_track_id: parentTrackId
        })
      )
    }
  }, [
    dispatch,
    parentTrackId,
    quality,
    shouldDisplayDownloadFollowGated,
    toast,
    track,
    trackId
  ])

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
