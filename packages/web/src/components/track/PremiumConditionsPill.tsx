import type { MouseEvent } from 'react'

import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  PremiumConditions
} from '@audius/common'
import { HarmonyButton, HarmonyButtonSize, IconLock } from '@audius/stems'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

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

  return (
    <HarmonyButton
      className={styles.button}
      size={HarmonyButtonSize.SMALL}
      onClick={onClick}
      color={isPurchase ? 'specialLightGreen' : 'accentBlue'}
      icon={icon}
      text={message}
    />
  )
}
