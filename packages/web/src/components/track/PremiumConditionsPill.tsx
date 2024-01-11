import type { MouseEvent } from 'react'

import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  PremiumConditions
} from '@audius/common'
import { Button, ButtonSize, IconLock } from '@audius/harmony'
import cn from 'classnames'

import styles from './PremiumConditionsPill.module.css'

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
}

export const PremiumConditionsPill = ({
  className,
  premiumConditions,
  unlocking,
  onClick,
  showIcon = true,
  buttonSize = 'small'
}: {
  premiumConditions: PremiumConditions
  unlocking: boolean
  onClick?: (e: MouseEvent) => void
  showIcon?: boolean
  className?: string
  buttonSize?: ButtonSize
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
      className={cn(styles.button, className)}
      size={buttonSize}
      onClick={onClick}
      color={isPurchase ? 'lightGreen' : 'blue'}
      isLoading={unlocking}
      iconLeft={showIcon ? IconLock : undefined}
    >
      {message}
    </Button>
  )
}
