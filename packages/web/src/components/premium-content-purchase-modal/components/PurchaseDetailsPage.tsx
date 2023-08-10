import { useCallback } from 'react'

import {
  ContentType,
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  purchaseContentActions,
  purchaseContentSelectors,
  PurchaseContentStage,
  Track,
  UserTrackMetadata
} from '@audius/common'
import { HarmonyButton } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'

import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseDetailsPage.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage } = purchaseContentSelectors

const messages = {
  buy: (price: string) => `Buy $${price}`,
  purchasing: 'Purchasing'
}

export const PurchaseDetailsPage = ({
  track
}: {
  track: UserTrackMetadata
}) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const isUnlocking = [
    PurchaseContentStage.BUY_USDC,
    PurchaseContentStage.PURCHASING,
    PurchaseContentStage.CONFIRMING_PURCHASE
  ].includes(stage)

  const onClickBuy = useCallback(() => {
    if (isUnlocking) return

    dispatch(
      startPurchaseContentFlow({
        contentId: track.track_id,
        contentType: ContentType.TRACK
      })
    )
  }, [isUnlocking, dispatch, track.track_id])

  if (!isPremiumContentUSDCPurchaseGated(track.premium_conditions)) {
    console.error(
      `Loaded Purchase modal with a non-USDC-gated track: ${track.track_id}`
    )
    return null
  }

  const { price } = track.premium_conditions.usdc_purchase

  const textContent = isUnlocking ? (
    <div className={styles.purchaseButtonText}>
      <LoadingSpinner className={styles.purchaseButtonSpinner} />
      <span>{messages.purchasing}</span>
    </div>
  ) : (
    messages.buy(formatPrice(price))
  )

  return (
    <div className={styles.container}>
      <LockedTrackDetailsTile
        // TODO: Remove this cast once typing is correct
        // https://linear.app/audius/issue/C-2899/fix-typing-for-computed-properties
        track={track as unknown as Track}
        owner={track.user}
      />
      <PurchaseSummaryTable
        artistCut={price}
        amountDue={price}
        basePrice={price}
      />
      <PayToUnlockInfo />
      <HarmonyButton
        disabled={isUnlocking}
        color='specialLightGreen'
        onClick={onClickBuy}
        text={textContent}
        fullWidth
      />
    </div>
  )
}
