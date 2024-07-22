import { useCallback } from 'react'

import type { SearchFilters } from '@audius/common/api'
import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { convertGenreLabelToValue } from '@audius/common/utils'
import type { Mood } from '@audius/sdk'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'
import { Image } from 'react-native'

import { Flex, Text, TextLink, spacing } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { moodMap } from 'app/utils/moods'

import { MetadataItem } from './MetadataItem'

const messages = {
  album: 'Album'
}

const renderMood = (mood: string, onPress: () => void) => {
  return (
    <TextLink variant='visible' onPress={onPress}>
      <Flex direction='row' gap='xs' alignItems='center'>
        <Text variant='body' size='s' strength='strong'>
          {mood}
        </Text>
        <Image
          source={moodMap[mood as Mood]}
          style={{ height: spacing.l, width: spacing.l }}
        />
      </Flex>
    </TextLink>
  )
}

const renderFilterLink = (value: string, onPress: () => void) => {
  return (
    <TextLink onPress={onPress}>
      <Text variant='body' size='s' strength='strong'>
        {value}
      </Text>
    </TextLink>
  )
}

const renderMetadataValue = (
  id: TrackMetadataType,
  value: string,
  handleFilterLinkPress: (filters: SearchFilters) => void
) => {
  switch (id) {
    case TrackMetadataType.MOOD:
      return renderMood(value, () => {
        handleFilterLinkPress({ mood: value as Mood })
      })
    case TrackMetadataType.GENRE:
    case TrackMetadataType.BPM:
    case TrackMetadataType.KEY:
      return renderFilterLink(value, () => {
        handleFilterLinkPress({
          [id]:
            id === TrackMetadataType.GENRE
              ? // @ts-ignore - need the converted electronic subgenre value for genre
                convertGenreLabelToValue(value)
              : value
        })
      })
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
  const navigation = useNavigation()

  const handleFilterLinkPress = useCallback(
    (filters: SearchFilters) => {
      navigation.navigate('Search', { category: 'tracks', filters })
    },
    [navigation]
  )

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
          {renderMetadataValue(id, value, handleFilterLinkPress)}
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
