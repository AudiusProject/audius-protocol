import { useCallback, useEffect } from 'react'

import {
  BNUSDC,
  getPurchaseSummaryValues,
  ContentType,
  isContentPurchaseInProgress,
  isPremiumContentUSDCPurchaseGated,
  purchaseContentActions,
  purchaseContentSelectors,
  PurchaseContentStage,
  Track,
  UserTrackMetadata,
  Name,
  Nullable
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyPlainButton,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType,
  IconCaretRight,
  IconCheck,
  IconError
} from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
import { Text } from 'components/typography'
import { pushUniqueRoute } from 'utils/route'

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
  purchaseSuccessful: 'Your Purchase Was Successful!',
  error: 'Your purchase was unsuccessful.',
  // TODO: PAY-1723
  shareButtonContent: 'I just purchased a track on Audius!',
  shareTwitterText: (trackTitle: string, handle: string, trackUrl: string) =>
    `I bought the track ${trackTitle} by ${handle} on Audius! #AudiusPremium ${trackUrl}`,
  viewTrack: 'View Track'
}

const useNavigateOnSuccess = (
  track: UserTrackMetadata,
  stage: PurchaseContentStage
) => {
  const dispatch = useDispatch()
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH) {
      dispatch(pushUniqueRoute(track.permalink))
    }
  }, [stage, track, dispatch])
}

const ContentPurchaseError = () => {
  return (
    <Text className={styles.errorContainer} color='accentRed'>
      <Icon icon={IconError} size='medium' />
      {messages.error}
    </Text>
  )
}

export type PurchaseDetailsPageProps = {
  currentBalance: Nullable<BNUSDC>
  track: UserTrackMetadata
  onViewTrackClicked: () => void
}

export const PurchaseDetailsPage = ({
  currentBalance,
  track,
  onViewTrackClicked
}: PurchaseDetailsPageProps) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const isPurchased = stage === PurchaseContentStage.FINISH
  const { handle } = track.user
  const { permalink, title } = track

  const onClickBuy = useCallback(() => {
    if (isUnlocking) return

    dispatch(
      startPurchaseContentFlow({
        contentId: track.track_id,
        contentType: ContentType.TRACK
      })
    )
  }, [isUnlocking, dispatch, track.track_id])

  useNavigateOnSuccess(track, stage)

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(title, handle, permalink)
      const analytics = make(Name.PURCHASE_CONTENT_TWITTER_SHARE, {
        text: shareText
      })
      return { shareText, analytics }
    },
    [permalink, title]
  )

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
      <PurchaseSummaryTable
        {...purchaseSummaryValues}
        isPurchased={isPurchased}
      />
      {isPurchased ? (
        <>
          <div className={styles.purchaseSuccessfulContainer}>
            <div className={styles.completionCheck}>
              <Icon icon={IconCheck} size='xxSmall' color='white' />
            </div>
            <Text variant='heading' size='small'>
              {messages.purchaseSuccessful}
            </Text>
          </div>
          <TwitterShareButton
            fullWidth
            type='dynamic'
            shareData={handleTwitterShare}
            handle={handle}
          />
          <HarmonyPlainButton
            onClick={onViewTrackClicked}
            iconRight={IconCaretRight}
            variant={HarmonyPlainButtonType.SUBDUED}
            size={HarmonyPlainButtonSize.LARGE}
            text={messages.viewTrack}
          />
        </>
      ) : (
        <>
          <PayToUnlockInfo />
          <HarmonyButton
            disabled={isUnlocking}
            color='specialLightGreen'
            onClick={onClickBuy}
            text={textContent}
            fullWidth
          />
        </>
      )}
      {error ? <ContentPurchaseError /> : null}
    </div>
  )
}
