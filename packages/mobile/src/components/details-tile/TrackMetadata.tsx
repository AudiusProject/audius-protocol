import { useGetTrackById } from '@audius/common/api'
import { useTrackMetadata } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'

import { Flex, TextLink } from '@audius/harmony-native'

import { MetadataRow } from './MetadataRow'

const messages = {
  album: 'Album'
}

type TrackMetadataProps = {
  trackId?: ID
}

/**
 * The additional metadata shown at the bottom of the Track Screen and Collection Screen Headers
 */
export const TrackMetadata = ({ trackId }: TrackMetadataProps) => {
  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: trackId! },
    { enabled: !!trackId }
  )

  const { labels } = useTrackMetadata({
    duration: track?.duration,
    releaseDate: track?.release_date,
    mood: track?.mood,
    genre: track?.genre,
    isUnlisted: track?.is_unlisted
  })

  return (
    <Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {labels.map((label) => (
        <MetadataRow key={label.id} label={label.label}>
          {label.value}
        </MetadataRow>
      ))}
      {albumInfo ? (
        <MetadataRow label={messages.album}>
          <TextLink to={albumInfo?.permalink}>
            {albumInfo?.playlist_name}
          </TextLink>
        </MetadataRow>
      ) : null}
    </Flex>
  )
}
