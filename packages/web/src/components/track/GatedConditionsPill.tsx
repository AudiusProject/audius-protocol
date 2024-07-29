import type { MouseEvent } from 'react'

import {
  isContentUSDCPurchaseGated,
  AccessConditions,
  isContentCrowdfundGated
} from '@audius/common/models'
import { formatPrice } from '@audius/common/utils'
import { Button, ButtonSize, IconLock, IconTipping } from '@audius/harmony'

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked',
  crowdfund: 'Contribute'
}

export const GatedConditionsPill = ({
  className,
  streamConditions,
  unlocking,
  onClick,
  showIcon = true,
  buttonSize = 'small'
}: {
  streamConditions: AccessConditions
  unlocking: boolean
  onClick?: (e: MouseEvent) => void
  showIcon?: boolean
  className?: string
  buttonSize?: ButtonSize
}) => {
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)
  const isCrowdfund = isContentCrowdfundGated(streamConditions)

  let message = null
  if (unlocking) {
    // Show only spinner when unlocking a purchase
    message = isPurchase ? undefined : messages.unlocking
  } else {
    message = isPurchase
      ? `$${formatPrice(streamConditions.usdc_purchase.price)}`
      : isCrowdfund
      ? messages.crowdfund
      : messages.locked
  }

  return (
    <Button
      className={className}
      size={buttonSize}
      onClick={onClick}
      color={isPurchase ? 'lightGreen' : 'blue'}
      hexColor={isCrowdfund ? '#49b69c' : undefined}
      isLoading={unlocking}
      iconLeft={showIcon ? (isCrowdfund ? IconTipping : IconLock) : undefined}
      // TODO: Add 'xs' button size in harmony
      css={{ height: '24px' }}
    >
      {message}
    </Button>
  )
}
