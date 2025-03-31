import { useTrackAccessTypeLabel } from '@audius/common/hooks'
import { ID } from '@audius/common/models'

import { AccessTypeLabel } from 'components/access-type-label'

type TrackAccessTypeLabelProps = {
  trackId: ID
}

export const TrackAccessTypeLabel = (props: TrackAccessTypeLabelProps) => {
  const { trackId } = props
  const { type, scheduledReleaseDate, isUnlocked } =
    useTrackAccessTypeLabel(trackId)

  if (!type) return null

  return (
    <AccessTypeLabel
      type={type}
      scheduledReleaseDate={scheduledReleaseDate}
      isUnlocked={isUnlocked}
    />
  )
}
