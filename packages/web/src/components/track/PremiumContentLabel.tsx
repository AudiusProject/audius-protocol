import { PremiumConditions, FeatureFlags, Nullable } from '@audius/common'
import { IconCollectible, IconSpecialAccess, IconUnlocked } from '@audius/stems'
import cn from 'classnames'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './desktop/TrackTile.module.css'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  unlocked: 'Unlocked'
}

export const PremiumContentLabel = ({
  premiumConditions,
  doesUserHaveAccess,
  isOwner
}: {
  premiumConditions?: Nullable<PremiumConditions>
  doesUserHaveAccess: boolean
  isOwner: boolean
}) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  if (isOwner) {
    return premiumConditions?.nft_collection ? (
      <div className={cn(styles.premiumContent, styles.topRightIconLabel)}>
        <IconCollectible className={styles.topRightIcon} />
        {messages.collectibleGated}
      </div>
    ) : (
      <div className={cn(styles.premiumContent, styles.topRightIconLabel)}>
        <IconSpecialAccess className={styles.topRightIcon} />
        {messages.specialAccess}
      </div>
    )
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
