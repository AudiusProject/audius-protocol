import type { MouseEvent } from 'react'

import {
  isContentUSDCPurchaseGated,
  AccessConditions,
  Name
} from '@audius/common/models'
import { formatPrice } from '@audius/common/utils'
import { Button, ButtonSize, IconLock } from '@audius/harmony'

import { make, track } from 'services/analytics'

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
  buttonSize = 'small',
  contentId,
  contentType
}: {
  streamConditions: AccessConditions
  unlocking: boolean
  onClick?: (e: MouseEvent) => void
  showIcon?: boolean
  className?: string
  buttonSize?: ButtonSize
  contentId: number
  contentType: string
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
      className={className}
      size={buttonSize}
      onClick={(e) => {
        e.stopPropagation()
        track(
          make({
            eventName: Name.PURCHASE_CONTENT_BUY_CLICKED,
            contentId,
            contentType
          })
        )

        onClick?.(e)
      }}
      color={isPurchase ? 'lightGreen' : 'blue'}
      isLoading={unlocking}
      iconLeft={showIcon ? IconLock : undefined}
      // TODO: Add 'xs' button size in harmony
      css={{ height: '24px' }}
    >
      {message}
    </Button>
  )
}
