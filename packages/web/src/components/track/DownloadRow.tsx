import {
  cacheTracksSelectors,
  toastActions,
  CommonState
} from '@audius/common/store'

import { useCallback } from 'react'

import {} from '@audius/common'
import { useDownloadableContentAccess } from '@audius/common/hooks'
import { DownloadQuality, ID } from '@audius/common/models'
import { Flex, IconReceive, PlainButton, Text } from '@audius/harmony'
import { useDispatch, shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'
const { toast } = toastActions

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  trackId: ID
  parentTrackId?: ID
  quality: DownloadQuality
  onDownload: ({
    trackId,
    category,
    original,
    parentTrackId
  }: {
    trackId: ID
    category?: string
    original?: boolean
    parentTrackId?: ID
  }) => void
  hideDownload?: boolean
  index: number
}

export const DownloadRow = ({
  trackId,
  parentTrackId,
  quality,
  onDownload,
  hideDownload,
  index
}: DownloadRowProps) => {
  const isMobile = useIsMobile()
  const dispatch = useDispatch()
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { shouldDisplayDownloadFollowGated } = useDownloadableContentAccess({
    trackId
  })

  const handleClick = useCallback(() => {
    if (isMobile && shouldDisplayDownloadFollowGated) {
      // On mobile, show a toast instead of a tooltip
      dispatch(toast({ content: messages.followToDownload }))
    } else if (track && track.access.download) {
      onDownload({
        trackId,
        category: track.stem_of?.category,
        original: quality === DownloadQuality.ORIGINAL,
        parentTrackId
      })
    }
  }, [
    isMobile,
    shouldDisplayDownloadFollowGated,
    track,
    dispatch,
    onDownload,
    trackId,
    quality,
    parentTrackId
  ])

  const downloadButton = () => (
    <PlainButton
      onClick={handleClick}
      disabled={shouldDisplayDownloadFollowGated}
    >
      <Icon icon={IconReceive} size='small' />
    </PlainButton>
  )

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
          <Text variant='body' color='subdued'>
            {track?.orig_filename}
          </Text>
        </Flex>
      </Flex>
      <Flex gap='2xl'>
        {hideDownload ? null : (
          <>
            <Text>size</Text>
            {shouldDisplayDownloadFollowGated ? (
              <Tooltip
                text={messages.followToDownload}
                placement='left'
                mouseEnterDelay={0}
              >
                {/* Need wrapping flex for the tooltip to appear for some reason */}
                <Flex>{downloadButton()}</Flex>
              </Tooltip>
            ) : (
              downloadButton()
            )}
          </>
        )}
      </Flex>
    </Flex>
  )
}
