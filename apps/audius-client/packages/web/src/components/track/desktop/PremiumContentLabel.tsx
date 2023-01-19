import { PremiumConditions, FeatureFlags, Nullable } from '@audius/common'
import { IconCollectible, IconSpecialAccess, IconUnlocked } from '@audius/stems'
import cn from 'classnames'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './TrackTile.module.css'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  unlocked: 'Unlocked'
}

export const PremiumContentLabel = ({
  premiumConditions,
  doesUserHaveAccess
}: {
  premiumConditions?: Nullable<PremiumConditions>
  doesUserHaveAccess: boolean
}) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  if (doesUserHaveAccess) {
    return (
      <div className={cn(styles.premiumContent, styles.topRightIconLabel)}>
        <IconUnlocked className={styles.topRightIcon} />
        {messages.unlocked}
      </div>
    )
  }

  if (premiumConditions?.nft_collection) {
    return (
      <div className={cn(styles.premiumContent, styles.topRightIconLabel)}>
        <IconCollectible className={styles.topRightIcon} />
        {messages.collectibleGated}
      </div>
    )
  }

  return (
    <div className={cn(styles.premiumContent, styles.topRightIconLabel)}>
      <IconSpecialAccess className={styles.topRightIcon} />
      {messages.specialAccess}
    </div>
  )
}
