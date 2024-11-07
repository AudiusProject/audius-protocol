import { useGetTrackById } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ID,
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated,
  Track
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'

import {
  LockedStatusPill,
  LockedStatusPillProps
} from 'components/locked-status-pill'

type TrackLockedStatusPillProps = {
  trackId: ID
}

export const TrackLockedStatusPill = (props: TrackLockedStatusPillProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )

  const { hasStreamAccess } = useGatedContentAccess(track as Nullable<Track>)

  if (!track) return null
  const { stream_conditions } = track

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibleGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)

  let variant: Nullable<LockedStatusPillProps['variant']> = null
  if (isPurchaseable) {
    variant = 'premium'
  } else if (isCollectibleGated) {
    variant = 'gated'
  } else if (isSpecialAccess) {
    variant = 'gated'
  }

  if (!variant) return null

  return <LockedStatusPill variant={variant} locked={!hasStreamAccess} />
}

export const useIsTrackUnlockable = (trackId: ID) => {
  const { data: track } = useGetTrackById({ id: trackId })

  if (!track) return false
  const { stream_conditions } = track
  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibleGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)

  return isPurchaseable || isCollectibleGated || isSpecialAccess
}
