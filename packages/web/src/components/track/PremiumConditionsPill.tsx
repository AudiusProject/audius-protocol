import { useCallback, MouseEvent } from 'react'

import {
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  PremiumConditions,
  premiumContentActions
} from '@audius/common'
import { HarmonyButton, HarmonyButtonSize, IconLock } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './PremiumConditionsPill.module.css'

const { setPurchaseContentId } = premiumContentActions

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
}

const usePurchaseModal = () => {
  const dispatch = useDispatch()
  const [, setPurchaseModalVisibility] = useModalState('PremiumContentPurchase')

  const callback = useCallback(
    (trackId: number) => {
      dispatch(setPurchaseContentId({ id: trackId }))
      setPurchaseModalVisibility(true)
    },
    [dispatch, setPurchaseModalVisibility]
  )
  return callback
}

export const PremiumConditionsPill = ({
  premiumConditions,
  unlocking,
  trackId
}: {
  premiumConditions: PremiumConditions
  unlocking: boolean
  trackId?: number
}) => {
  const isPurchase = isPremiumContentUSDCPurchaseGated(premiumConditions)
  const openPurchaseModal = usePurchaseModal()
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

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (isPurchase && trackId) {
        e.stopPropagation()
        openPurchaseModal(trackId)
      }
    },
    [isPurchase, trackId, openPurchaseModal]
  )

  return (
    <HarmonyButton
      className={styles.button}
      size={HarmonyButtonSize.SMALL}
      onClick={handleClick}
      color={isPurchase ? 'specialLightGreen' : 'accentBlue'}
      icon={icon}
      text={message}
    />
  )
}
