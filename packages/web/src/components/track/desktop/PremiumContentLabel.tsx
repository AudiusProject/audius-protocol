import { useCallback } from 'react'

import { PremiumConditions, FeatureFlags, Nullable } from '@audius/common'
import { IconCollectible, IconSpecialAccess, IconUnlocked } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './TrackTile.module.css'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  unlocked: 'Unlocked'
}

export const PremiumContentLabel = ({
  premiumConditions,
  doesUserHaveAccess,
  isOwner,
  permalink
}: {
  premiumConditions?: Nullable<PremiumConditions>
  doesUserHaveAccess: boolean
  isOwner: boolean
  permalink: string
}) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(pushRoute(permalink))
  }, [dispatch, permalink])

  if (!isPremiumContentEnabled) {
    return null
  }

  if (isOwner) {
    return premiumConditions?.nft_collection ? (
      <div
        className={cn(styles.premiumContent, styles.topRightIconLabel)}
        onClick={handleClick}
      >
        <IconCollectible className={styles.topRightIcon} />
        {messages.collectibleGated}
      </div>
    ) : (
      <div
        className={cn(styles.premiumContent, styles.topRightIconLabel)}
        onClick={handleClick}
      >
        <IconSpecialAccess className={styles.topRightIcon} />
        {messages.specialAccess}
      </div>
    )
  }

  if (doesUserHaveAccess) {
    return (
      <div
        className={cn(styles.premiumContent, styles.topRightIconLabel)}
        onClick={handleClick}
      >
        <IconUnlocked className={styles.topRightIcon} />
        {messages.unlocked}
      </div>
    )
  }

  if (premiumConditions?.nft_collection) {
    return (
      <div
        className={cn(styles.premiumContent, styles.topRightIconLabel)}
        onClick={handleClick}
      >
        <IconCollectible className={styles.topRightIcon} />
        {messages.collectibleGated}
      </div>
    )
  }

  return (
    <div
      className={cn(styles.premiumContent, styles.topRightIconLabel)}
      onClick={handleClick}
    >
      <IconSpecialAccess className={styles.topRightIcon} />
      {messages.specialAccess}
    </div>
  )
}
