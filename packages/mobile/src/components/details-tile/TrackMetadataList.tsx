import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import type { Mood } from '@audius/sdk'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'
import { Image } from 'react-native'

import { Flex, Text, TextLink, spacing } from '@audius/harmony-native'
import { moodMap } from 'app/utils/moods'

import { MetadataItem } from './MetadataItem'

const messages = {
  album: 'Album'
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
const renderMetadataValue = (id: TrackMetadataType, value: string) => {
  switch (id) {
    case TrackMetadataType.MOOD:
      return renderMood(value)
    default:
      return value
  }
}

type TrackMetadataListProps = {
  trackId: ID
}

/**
 * The additional metadata shown at the bottom of the Track Screen and Collection Screen Headers
 */
export const TrackMetadataList = ({ trackId }: TrackMetadataListProps) => {
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery({
    trackId
  })

  const metadataItems = useTrackMetadata({
    trackId
  })

  return (
    <Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {metadataItems.map(({ id, label, value }) => (
        <MetadataItem key={id} label={label}>
          {renderMetadataValue(id, value)}
        </MetadataItem>
      ))}
      {albumInfo ? (
        <MetadataItem label={messages.album}>
          <TextLink to={albumInfo.permalink}>
            {albumInfo.playlist_name}
          </TextLink>
        </MetadataItem>
      ) : null}
    </Flex>
  )
}
