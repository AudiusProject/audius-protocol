import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { Flex } from '@audius/harmony'
import { Mood } from '@audius/sdk'

import { MetadataItem } from 'components/entity/MetadataItem'
import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import { moodMap } from 'utils/Moods'

type TrackMetadataListProps = {
  trackId: ID
}

/**
 * The additional metadata shown at the bottom of the Track Page Header
 */
const TrackMetadataListContent = (props: TrackMetadataListProps) => {
  const { trackId } = props
  const metadataItems = useTrackMetadata({
    trackId
  })

  const renderMood = (value: string) => moodMap[value as Mood]

  return (
    <Flex as='dl' w='100%' gap='l' wrap='wrap'>
      {metadataItems.map(({ id, label, value, url }) => (
        <MetadataItem
          key={id}
          label={label}
          value={value}
          url={url}
          renderValue={id === TrackMetadataType.MOOD ? renderMood : undefined}
        />
      ))}
    </Flex>
  )
}

export const TrackMetadataList = componentWithErrorBoundary(
  TrackMetadataListContent,
  {
    name: 'TrackMetadataList'
  }
)
