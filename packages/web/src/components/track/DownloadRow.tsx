import { useDownloadableContentAccess } from '@audius/common/hooks'
import {
  ID,
  StemCategory,
  stemCategoryFriendlyNames
} from '@audius/common/models'
import { cacheTracksSelectors, CommonState } from '@audius/common/store'
import { getDownloadFilename, formatBytes } from '@audius/common/utils'
import { Flex, IconReceive, PlainButton, Text } from '@audius/harmony'
import { shallowEqual, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './DownloadRow.module.css'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  onDownload: (args: { trackIds: ID[]; parentTrackId?: ID }) => void
  isOriginal: boolean
  trackId?: ID
  parentTrackId?: ID
  hideDownload?: boolean
  index: number
  size?: number
  category?: StemCategory
  filename?: string
  isLoading?: boolean
}

export const DownloadRow = ({
  onDownload,
  isOriginal,
  trackId,
  parentTrackId,
  hideDownload,
  index,
  size,
  category,
  filename,
  isLoading
}: DownloadRowProps) => {
  const isMobile = useIsMobile()
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const downloadableContentAccess = useDownloadableContentAccess({
    trackId: parentTrackId ?? trackId ?? 0
  })
  const { shouldDisplayDownloadFollowGated } = parentTrackId
    ? downloadableContentAccess
    : { shouldDisplayDownloadFollowGated: false }

  const downloadButton = () => (
    <PlainButton
      onClick={() =>
        onDownload({
          trackIds: trackId ? [trackId] : []
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
      w='100%'
      gap='xs'
    >
      <Flex gap='xl' alignItems='center' w='100%' css={{ overflow: 'hidden' }}>
        <Text variant='body' color='subdued'>
          {index}
        </Text>
        <Flex direction='column' gap='xs' css={{ overflow: 'hidden' }} w='100%'>
          <Text variant='body' strength='default'>
            {category
              ? stemCategoryFriendlyNames[category]
              : track?.stem_of?.category
              ? stemCategoryFriendlyNames[track?.stem_of?.category]
              : messages.fullTrack}
          </Text>
          <Text
            variant='body'
            color='subdued'
            css={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              'white-space': 'nowrap'
            }}
          >
            {getDownloadFilename({
              filename: filename ?? track?.orig_filename,
              isOriginal
            })}
          </Text>
        </Flex>
      </Flex>
      <Flex gap='2xl'>
        {size && !isMobile ? (
          <Text variant='body' size='s' color='subdued'>
            {formatBytes(size)}
          </Text>
        ) : null}
        {hideDownload ? null : (
          <>
            {shouldDisplayDownloadFollowGated ? (
              <Tooltip
                text={messages.followToDownload}
                placement='left'
                mouseEnterDelay={0}
              >
                {/* Need wrapping flex for the tooltip to appear for some reason */}
                <Flex>{downloadButton()}</Flex>
              </Tooltip>
            ) : isLoading ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              downloadButton()
            )}
          </>
        )}
      </Flex>
    </Flex>
  )
}
