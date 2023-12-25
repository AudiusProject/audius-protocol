import type { MouseEvent } from 'react'

import {
  formatPrice,
  isContentUSDCPurchaseGated,
  AccessConditions
} from '@audius/common'
import { Button, ButtonSize, IconLock } from '@audius/harmony'
import cn from 'classnames'

import styles from './GatedConditionsPill.module.css'

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
}

export const GatedConditionsPill = ({
  className,
  streamConditions,
  unlocking,
  onClick,
  showIcon = true,
  buttonSize = ButtonSize.SMALL
}: {
  streamConditions: AccessConditions
  unlocking: boolean
  onClick?: (e: MouseEvent) => void
  showIcon?: boolean
  className?: string
  buttonSize?: ButtonSize
}) => {
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  let message = null
  if (unlocking) {
    // Show only spinner when unlocking a purchase
    message = isPurchase ? undefined : messages.unlocking
  } else {
    message = isPurchase
      ? `$${formatPrice(streamConditions.usdc_purchase.price)}`
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
