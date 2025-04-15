import { useTrack, useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { stemCategoryFriendlyNames } from '@audius/common/models'
import { getFilename } from '@audius/common/utils'
import { css } from '@emotion/native'

import { Flex, Text, IconReceive, Box } from '@audius/harmony-native'
import { PlainButton } from 'app/harmony-native/components/Button/PlainButton/PlainButton'

const messages = {
  fullTrack: 'Full Track'
}

type DownloadRowProps = {
  trackId: ID
  hideDownload?: boolean
  index: number
  onDownload: (args: { trackIds: ID[]; parentTrackId?: ID }) => void
}

export const DownloadRow = ({
  trackId,
  hideDownload,
  index,
  onDownload
}: DownloadRowProps) => {
  const { data: track } = useTrack(trackId)
  const { data: user } = useUser(track?.owner_id)

  const filename =
    track && user ? getFilename({ track, user, isOriginal: true }) : null

  return (
    <Flex row alignItems='center' justifyContent='space-between'>
      <Flex row gap='m' alignItems='center' style={css({ flexShrink: 1 })}>
        <Text variant='body' color='subdued'>
          {index}
        </Text>
        <Text
          variant='body'
          ellipsizeMode='tail'
          numberOfLines={1}
          style={css({ flexShrink: 1 })}
        >
          {filename}
        </Text>
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
