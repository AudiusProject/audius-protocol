import type { ID } from '@audius/common/models'
import { stemCategoryFriendlyNames } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { cacheTracksSelectors } from '@audius/common/store'
import { getDownloadFilename } from '@audius/common/utils'
import { css } from '@emotion/native'
import { useSelector } from 'react-redux'

import { Flex, Text, IconReceive, Box } from '@audius/harmony-native'
import { PlainButton } from 'app/harmony-native/components/Button/PlainButton/PlainButton'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track',
  followToDownload: 'Must follow artist to download.'
}

type DownloadRowProps = {
  trackId: ID
  hideDownload?: boolean
  index: number
  onDownload: (args: { trackIds: ID[]; parentTrackId?: ID }) => void
  isOriginal: boolean
}

export const DownloadRow = ({
  trackId,
  hideDownload,
  index,
  onDownload,
  isOriginal = true
}: DownloadRowProps) => {
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )

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
            {track?.stem_of?.category
              ? stemCategoryFriendlyNames[track?.stem_of?.category]
              : messages.fullTrack}
          </Text>
          <Text
            variant='body'
            color='subdued'
            ellipsizeMode='tail'
            numberOfLines={1}
          >
            {getDownloadFilename({
              filename: track?.orig_filename,
              isOriginal
            })}
          </Text>
        </Flex>
      </Flex>
      {hideDownload ? null : (
        <PlainButton
          hitSlop={{ top: 12, left: 8, right: 8, bottom: 12 }}
          onPress={() => onDownload({ trackIds: [trackId] })}
        >
          <Box ph='s' pv='m'>
            <IconReceive color='subdued' size='s' />
          </Box>
        </PlainButton>
      )}
    </Flex>
  )
}
