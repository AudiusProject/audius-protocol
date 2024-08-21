import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { trpc } from '@audius/common/services'
import { Flex } from '@audius/harmony'
import { Mood } from '@audius/sdk'

import { MetadataItem } from 'components/entity/MetadataItem'
import { TextLink } from 'components/link'
import { useIsMobile } from 'hooks/useIsMobile'
import { moodMap } from 'utils/Moods'
import { getSearchPageLocation } from 'utils/route'

type TrackMetadataListProps = {
  trackId: ID
}

/**
 * The additional metadata shown at the bottom of the Track Page Header
 */
export const TrackMetadataList = (props: TrackMetadataListProps) => {
  const { trackId } = props
  const isMobile = useIsMobile()
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId },
    { enabled: !!trackId }
  )
  const metadataItems = useTrackMetadata({
    trackId
  })

  return (
    <Flex as='dl' w='100%' gap='l' wrap='wrap'>
      {metadataItems.map(({ id, label, value }) => (
        <MetadataItem key={id} label={label}>
          <TextLink
            to={getSearchPageLocation({ category: 'tracks', [id]: value })}
            variant={isMobile ? 'visible' : 'default'}
          >
            {id === TrackMetadataType.MOOD && value in moodMap
              ? moodMap[value as Mood]
              : value}
          </TextLink>
        </MetadataItem>
      ))}
      {albumInfo ? (
        <MetadataItem label='album'>
          <TextLink
            to={albumInfo.permalink}
            variant={isMobile ? 'visible' : 'default'}
          >
            {albumInfo.playlist_name}
          </TextLink>
        </MetadataItem>
      ) : null}
    </Flex>
  )
}
