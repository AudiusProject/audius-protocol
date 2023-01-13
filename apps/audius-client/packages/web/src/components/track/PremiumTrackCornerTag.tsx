import { FeatureFlags } from '@audius/common'
import { IconLockedCornerTag, IconUnlockedCornerTag } from '@audius/stems'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './GiantTrackTile.module.css'

type PremiumTrackCornerTagProps = {
  doesUserHaveAccess: boolean
}

export const PremiumTrackCornerTag = ({
  doesUserHaveAccess
}: PremiumTrackCornerTagProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  if (doesUserHaveAccess) {
    return <IconUnlockedCornerTag className={styles.cornerTag} />
  }

  return <IconLockedCornerTag className={styles.cornerTag} />
}
