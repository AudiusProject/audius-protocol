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
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )

  if (!isGatedContentEnabled) {
    return null
  }

  if (!isOwner && doesUserHaveAccess) {
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
