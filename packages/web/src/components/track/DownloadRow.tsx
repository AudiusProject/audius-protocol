import { useCallback } from 'react'

import { useDownloadableContentAccess } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { cacheTracksSelectors, CommonState } from '@audius/common/store'
import { Flex, IconReceive, PlainButton, Text } from '@audius/harmony'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import Tooltip from 'components/tooltip/Tooltip'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  trackId: ID
  onDownload: (args: { trackIds: ID[]; parentTrackId?: ID }) => void
  hideDownload?: boolean
  index: number
}

export const DownloadRow = ({
  trackId,
  onDownload,
  hideDownload,
  index
}: DownloadRowProps) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { shouldDisplayDownloadFollowGated } = useDownloadableContentAccess({
    trackId
  })

  const downloadButton = () => (
    <PlainButton
      onClick={() =>
        onDownload({
          trackIds: [trackId]
        })
      }
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
