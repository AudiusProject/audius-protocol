import { useCallback } from 'react'

import {
  AlbumInfo,
  TrackMetadataType,
  useFeatureFlag,
  useTrackMetadata
} from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { getCanonicalName } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { Mood } from '@audius/sdk'
import { generatePath } from 'react-router-dom'

import { MetadataItem } from 'components/entity/MetadataItem'
import { TextLink } from 'components/link'
import { moodMap } from 'utils/Moods'
import { SEARCH_PAGE } from 'utils/route'
import { trpc } from 'utils/trpcClientWeb'

type TrackMetadataListProps = {
  trackId: ID
}

const renderMood = (mood: Mood) => {
  return (
    <TextLink
      to={{
        pathname: generatePath(SEARCH_PAGE, { category: 'tracks' }),
        search: new URLSearchParams({ mood }).toString()
      }}
    >
      {mood in moodMap ? moodMap[mood] : mood}
    </TextLink>
  )
}

const renderMoodLegacy = (mood: Mood) => {
  return mood in moodMap ? moodMap[mood] : mood
}

const renderGenre = (genre: string) => {
  return (
    <TextLink
      to={{
        pathname: generatePath(SEARCH_PAGE, { category: 'tracks' }),
        search: new URLSearchParams({ genre }).toString()
      }}
    >
      {getCanonicalName(genre)}
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
          return isSearchV2Enabled ? renderGenre(value) : undefined
        case TrackMetadataType.MOOD:
          return isSearchV2Enabled
            ? renderMood(value as Mood)
            : renderMoodLegacy(value as Mood)
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
