import { useTrackAccessTypeLabel } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'

import { AccessTypeLabel } from '../core/AccessTypeLabel'

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
