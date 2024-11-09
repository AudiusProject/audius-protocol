import { useGetTrackById } from '@audius/common/api'
import {
  useGatedContentAccess,
  useTrackLockedStatusVariant
} from '@audius/common/hooks'
import type { ID, Track } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'

import { LockedStatusBadge } from '../core/LockedStatusBadge'

type TrackLockedStatusBadgeProps = {
  trackId: ID
}

export const TrackLockedStatusBadge = (props: TrackLockedStatusBadgeProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )

  const { hasStreamAccess } = useGatedContentAccess(track as Nullable<Track>)
  const variant = useTrackLockedStatusVariant(trackId)
  if (!variant) return null

  return <LockedStatusBadge variant={variant} locked={!hasStreamAccess} />
}
