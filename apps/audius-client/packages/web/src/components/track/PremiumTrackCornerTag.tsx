import { FeatureFlags, PremiumConditions } from '@audius/common'
import {
  IconLockedCornerTag,
  IconCollectibleCornerTag,
  IconSpecialAccessCornerTag
} from '@audius/stems'
import cn from 'classnames'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './GiantTrackTile.module.css'

type PremiumTrackCornerTagProps = {
  doesUserHaveAccess: boolean
  isOwner: boolean
  premiumConditions: PremiumConditions
  className?: string
}

export const PremiumTrackCornerTag = ({
  doesUserHaveAccess,
  isOwner,
  premiumConditions,
  className
}: PremiumTrackCornerTagProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  if (isOwner) {
    if (premiumConditions.nft_collection) {
      return (
        <IconCollectibleCornerTag className={cn(styles.cornerTag, className)} />
      )
    }
    return (
      <IconSpecialAccessCornerTag className={cn(styles.cornerTag, className)} />
    )
  }

  if (doesUserHaveAccess) {
    return null
  }

  return <IconLockedCornerTag className={cn(styles.cornerTag, className)} />
}
