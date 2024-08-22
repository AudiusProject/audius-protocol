import { useCallback } from 'react'

import {
  AlbumInfo,
  TrackMetadataType,
  useFeatureFlag,
  useTrackMetadata
} from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { FeatureFlags, trpc } from '@audius/common/services'
import { Flex } from '@audius/harmony'
import { Genre, Mood } from '@audius/sdk'

import { MetadataItem } from 'components/entity/MetadataItem'
import { TextLink } from 'components/link'
import { moodMap } from 'utils/Moods'
import { getSearchPageLocation } from 'utils/route'

const renderMood = (mood: Mood) => {
  return (
    <TextLink to={getSearchPageLocation({ category: 'tracks', mood })}>
      {mood in moodMap ? moodMap[mood] : mood}
    </TextLink>
  )
}

const renderMoodLegacy = (mood: Mood) => {
  return mood in moodMap ? moodMap[mood] : mood
}

const renderGenre = (genre: Genre) => {
  return (
    <TextLink to={getSearchPageLocation({ category: 'tracks', genre })}>
      {genre}
    </TextLink>
  )
}

const renderBpm = (bpm: string) => {
  return (
    <TextLink to={getSearchPageLocation({ category: 'tracks', bpm })}>
      {bpm}
    </TextLink>
  )
}

const renderMusicalKey = (key: string) => {
  return (
    <TextLink to={getSearchPageLocation({ category: 'tracks', key })}>
      {key}
    </TextLink>
  )
}

const renderAlbum = (albumInfo: AlbumInfo) => {
  return (
    <MetadataItem label='album'>
      <TextLink to={albumInfo.permalink}>{albumInfo.playlist_name}</TextLink>
    </MetadataItem>
  )
}

type TrackMetadataListProps = {
  trackId: ID
}

/**
 * The additional metadata shown at the bottom of the Track Page Header
 */
export const TrackMetadataList = ({ trackId }: TrackMetadataListProps) => {
  const { isEnabled: isSearchV2Enabled } = useFeatureFlag(
    FeatureFlags.SEARCH_V2
  )
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId },
    { enabled: !!trackId }
  )
  const metadataItems = useTrackMetadata({
    trackId
  })

  const renderMetadataValue = useCallback(
    (id: TrackMetadataType, value: string) => {
      switch (id) {
        case TrackMetadataType.GENRE:
          return isSearchV2Enabled ? renderGenre(value as Genre) : value
        case TrackMetadataType.MOOD:
          return isSearchV2Enabled
            ? renderMood(value as Mood)
            : renderMoodLegacy(value as Mood)
        case TrackMetadataType.BPM:
          return isSearchV2Enabled ? renderBpm(value) : undefined
        case TrackMetadataType.KEY:
          return isSearchV2Enabled ? renderMusicalKey(value) : undefined
        default:
          return value
      }
    },
    [isSearchV2Enabled]
  )

  return (
    <Flex as='dl' w='100%' gap='l' wrap='wrap'>
      {metadataItems.map(({ id, label, value }) => (
        <MetadataItem key={id} label={label}>
          {renderMetadataValue(id, value)}
        </MetadataItem>
      ))}
      {albumInfo ? renderAlbum(albumInfo) : null}
    </Flex>
  )
}
