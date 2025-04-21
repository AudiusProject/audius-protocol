import { useTrack, useUser } from '@audius/common/api'
import { useDownloadableContentAccess } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { getFilename } from '@audius/common/utils'
import { Flex, IconButton, IconReceive, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

type DownloadRowProps = {
  onDownload: (args: { trackIds: ID[]; parentTrackId?: ID }) => void
  trackId?: ID
  parentTrackId?: ID
  hideDownload?: boolean
  index: number
  isLoading?: boolean
}

const messages = {
  download: 'Download'
}

export const DownloadRow = ({
  onDownload,
  trackId,
  parentTrackId,
  hideDownload,
  index,
  isLoading
}: DownloadRowProps) => {
  const { data: track } = useTrack(trackId)
  const { data: user } = useUser(track?.owner_id)

  const downloadableContentAccess = useDownloadableContentAccess({
    trackId: parentTrackId ?? trackId ?? 0
  })
  const { shouldDisplayDownloadFollowGated } = parentTrackId
    ? downloadableContentAccess
    : { shouldDisplayDownloadFollowGated: false }

  const filename =
    track && user ? getFilename({ track, user, isOriginal: true }) : null

  return (
    <Flex
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      w='100%'
      css={{
        backgroundColor: 'var(--harmony-white)'
      }}
    >
      <Flex
        row
        gap='m'
        alignItems='center'
        css={{
          flexShrink: 1,
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        <Text variant='body' color='subdued'>
          {index}
        </Text>
        <Text
          variant='body'
          css={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flexGrow: 1
          }}
        >
          {filename}
        </Text>
      </Flex>
      {hideDownload ? null : isLoading ? (
        <LoadingSpinner css={{ width: 16, height: 16 }} />
      ) : (
        <IconButton
          icon={IconReceive}
          size='s'
          aria-label={messages.download}
          color='subdued'
          onClick={() =>
            onDownload({
              trackIds: trackId ? [trackId] : []
            })
          }
          disabled={shouldDisplayDownloadFollowGated}
          css={{
            padding: 'var(--harmony-unit-2) var(--harmony-unit-1)'
          }}
        />
      )}
    </Flex>
  )
}
