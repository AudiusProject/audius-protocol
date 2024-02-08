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
  hideDownload,
  index,
  size,
  category,
  filename,
  isLoading
}: DownloadRowProps) => {
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { shouldDisplayDownloadFollowGated } = trackId
    ? useDownloadableContentAccess({
        trackId
      })
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
    >
      <Flex gap='xl' alignItems='center'>
        <Text variant='body' color='subdued'>
          {index}
        </Text>
        <Flex direction='column' gap='xs'>
          <Text variant='body' strength='default'>
            {category
              ? stemCategoryFriendlyNames[category]
              : track?.stem_of?.category
              ? stemCategoryFriendlyNames[track?.stem_of?.category]
              : messages.fullTrack}
          </Text>
          <Text variant='body' color='subdued'>
            {getDownloadFilename({
              filename: filename ?? track?.orig_filename,
              isOriginal
            })}
          </Text>
        </Flex>
      </Flex>
      <Flex gap='2xl'>
        {hideDownload ? null : (
          <>
            {size ? (
              <Text variant='body' size='s' color='subdued'>
                {formatBytes(size)}
              </Text>
            ) : null}
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
