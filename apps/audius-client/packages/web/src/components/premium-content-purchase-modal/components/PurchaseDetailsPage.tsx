import { useCallback } from 'react'

import {
  BNUSDC,
  getPurchaseSummaryValues,
  ContentType,
  isContentPurchaseInProgress,
  isPremiumContentUSDCPurchaseGated,
  purchaseContentActions,
  purchaseContentSelectors,
  Track,
  UserTrackMetadata
} from '@audius/common'
import { HarmonyButton, IconError } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { Text } from 'components/typography'

import { FormatPrice } from './FormatPrice'
import { PayToUnlockInfo } from './PayToUnlockInfo'
import styles from './PurchaseDetailsPage.module.css'
import { PurchaseSummaryTable } from './PurchaseSummaryTable'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const messages = {
  buy: 'Buy',
  purchasing: 'Purchasing',
  error: 'Your purchase was unsuccessful.'
}

const ContentPurchaseError = () => {
  return (
    <Text className={styles.errorContainer} color='--accent-red'>
      <Icon icon={IconError} size='medium' />
      {messages.error}
    </Text>
  )
}

export type PurchaseDetailsPageProps = {
  currentBalance?: BNUSDC
  track: UserTrackMetadata
}

export const PurchaseDetailsPage = ({
  currentBalance,
  track
}: PurchaseDetailsPageProps) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

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

  const purchaseSummaryValues = getPurchaseSummaryValues(price, currentBalance)
  const { basePrice, amountDue } = purchaseSummaryValues

  const textContent = isUnlocking ? (
    <div className={styles.purchaseButtonText}>
      <LoadingSpinner className={styles.purchaseButtonSpinner} />
      <span>{messages.purchasing}</span>
    </div>
  ) : amountDue > 0 ? (
    <div className={styles.purchaseButtonText}>
      {messages.buy}
      <FormatPrice basePrice={basePrice} amountDue={amountDue} />
    </div>
  ) : (
    messages.buy
  )

  return (
    <div className={styles.container}>
      <LockedTrackDetailsTile
        // TODO: Remove this cast once typing is correct
        // https://linear.app/audius/issue/C-2899/fix-typing-for-computed-properties
        track={track as unknown as Track}
        owner={track.user}
      />
      <PurchaseSummaryTable {...purchaseSummaryValues} />
      <PayToUnlockInfo />
      <HarmonyButton
        disabled={isUnlocking}
        color='specialLightGreen'
        onClick={onClickBuy}
        text={textContent}
        fullWidth
      />
      {error ? <ContentPurchaseError /> : null}
    </div>
  )
}
