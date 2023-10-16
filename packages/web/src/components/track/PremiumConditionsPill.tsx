import type { MouseEvent } from 'react'

import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  PremiumConditions
} from '@audius/common'
import { Button, ButtonSize, IconLock } from '@audius/harmony'

import styles from './PremiumConditionsPill.module.css'

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
}

export const PremiumConditionsPill = ({
  premiumConditions,
  unlocking,
  onClick
}: {
  premiumConditions: PremiumConditions
  unlocking: boolean
  onClick?: (e: MouseEvent) => void
}) => {
  const isPurchase = isPremiumContentUSDCPurchaseGated(premiumConditions)

  let message = null
  if (unlocking) {
    // Show only spinner when unlocking a purchase
    message = isPurchase ? undefined : messages.unlocking
  } else {
    message = isPurchase
      ? `$${formatPrice(premiumConditions.usdc_purchase.price)}`
      : messages.locked
  }

  return (
    <Button
      className={styles.button}
      size={ButtonSize.SMALL}
      onClick={onClick}
      color={isPurchase ? 'lightGreen' : 'blue'}
      isLoading={unlocking}
      iconLeft={IconLock}
      text={message}
    />
  )
}
