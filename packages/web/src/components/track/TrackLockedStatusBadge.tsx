import {
  useGatedTrackAccess,
  useTrackLockedStatusVariant
} from '@audius/common/hooks'
import { ID } from '@audius/common/models'

import { LockedStatusBadge } from 'components/locked-status-badge'

type TrackLockedStatusBadgeProps = {
  trackId: ID
}

export const TrackLockedStatusBadge = (props: TrackLockedStatusBadgeProps) => {
  const { trackId } = props

  const { hasStreamAccess } = useGatedTrackAccess(trackId)
  const variant = useTrackLockedStatusVariant(trackId)

  if (!variant) return null

  return <LockedStatusBadge variant={variant} locked={!hasStreamAccess} />
}
