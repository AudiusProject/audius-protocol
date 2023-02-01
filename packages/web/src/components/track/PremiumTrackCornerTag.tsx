import { FeatureFlags, PremiumConditions } from '@audius/common'
import {
  IconLockedCornerTag,
  IconCollectibleCornerTag,
  IconSpecialAccessCornerTag
} from '@audius/stems'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './GiantTrackTile.module.css'

type PremiumTrackCornerTagProps = {
  doesUserHaveAccess: boolean
  isOwner: boolean
  premiumConditions: PremiumConditions
}

export const PremiumTrackCornerTag = ({
  doesUserHaveAccess,
  isOwner,
  premiumConditions
}: PremiumTrackCornerTagProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  if (isOwner) {
    if (premiumConditions.nft_collection) {
      return <IconCollectibleCornerTag className={styles.cornerTag} />
    }
    return <IconSpecialAccessCornerTag className={styles.cornerTag} />
  }

  if (doesUserHaveAccess) {
    return null
  }

  return <IconLockedCornerTag className={styles.cornerTag} />
}
