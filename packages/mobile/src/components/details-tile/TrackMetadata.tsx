import { useGetTrackById } from '@audius/common/api'
import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import type { Mood } from '@audius/sdk'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'
import { Image } from 'react-native'

import { Flex, Text, TextLink, spacing } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

import { MetadataRow } from './MetadataRow'

const messages = {
  album: 'Album'
}

const renderTrackLabelMapping = (value: string) => {
  return {
    [TrackMetadataType.MOOD]: renderMood(value)
  }
}

const renderMood = (mood: string) => {
  return (
    <Flex direction='row' gap='xs' alignItems='center'>
      <Text variant='body' size='s' strength='strong'>
        {mood}
      </Text>
      <Image
        source={moodMap[mood as Mood]}
        style={{ height: spacing.l, width: spacing.l }}
      />
    </Flex>
  )
}

type TrackMetadataProps = {
  trackId: ID
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
          {renderTrackLabelMapping(label.value)[label.id] ?? label.value}
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
