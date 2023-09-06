import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  PremiumConditions
} from '@audius/common'
import { IconLock } from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './PremiumConditionsPill.module.css'

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
}

export const PremiumConditionsPill = ({
  premiumConditions,
  unlocking
}: {
  premiumConditions: PremiumConditions
  unlocking: boolean
}) => {
  const isPurchase = isPremiumContentUSDCPurchaseGated(premiumConditions)
  const icon = unlocking ? (
    <LoadingSpinner className={styles.spinner} />
  ) : isPurchase ? null : (
    <IconLock />
  )

  let message = null
  if (unlocking) {
    // Show only spinner when unlocking a purchase
    message = isPurchase ? null : messages.unlocking
  } else {
    message = isPurchase
      ? `$${formatPrice(premiumConditions.usdc_purchase.price)}`
      : messages.locked
  }

  const colorStyle = isPurchase ? styles.premiumContent : styles.gatedContent

  return (
    <div className={cn(styles.container, colorStyle)}>
      {icon}
      {message}
    </div>
  )
}
