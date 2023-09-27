import { useCallback } from 'react'

import {
  Name,
  PurchasableTrackMetadata,
  PurchaseContentFormState,
  PurchaseContentStage,
  formatPrice
} from '@audius/common'
import {
  HarmonyButton,
  HarmonyPlainButton,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType,
  IconCaretRight,
  IconError
} from '@audius/stems'

import { make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
import { Text } from 'components/typography'
import { fullTrackPage } from 'utils/route'

import styles from './PurchaseContentFormFooter.module.css'

const messages = {
  buy: 'Buy',
  viewTrack: 'View Track',
  purchasing: 'Purchasing',
  shareButtonContent: 'I just purchased a track on Audius!',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `I bought the track ${trackTitle} by ${handle} on Audius! #AudiusPremium`,
  purchaseSuccessful: 'Your Purchase Was Successful!',
  error: 'Your purchase was unsuccessful.'
}

const ContentPurchaseError = () => {
  return (
    <Text className={styles.errorContainer} color='accentRed'>
      <Icon icon={IconError} size='medium' />
      {messages.error}
    </Text>
  )
}

const getButtonContent = (isUnlocking: boolean, amountDue: number) =>
  isUnlocking ? (
    <div className={styles.purchaseButtonText}>
      <LoadingSpinner className={styles.spinner} />
      <span>{messages.purchasing}</span>
    </div>
  ) : amountDue > 0 ? (
    `${messages.buy} $${formatPrice(amountDue)}`
  ) : (
    messages.buy
  )

type PurchaseContentFormFooterProps = Pick<
  PurchaseContentFormState,
  'error' | 'isUnlocking' | 'purchaseSummaryValues' | 'stage'
> & {
  track: PurchasableTrackMetadata
  onViewTrackClicked: () => void
}

export const PurchaseContentFormFooter = ({
  error,
  track,
  isUnlocking,
  purchaseSummaryValues,
  stage,
  onViewTrackClicked
}: PurchaseContentFormFooterProps) => {
  const {
    title,
    permalink,
    user: { handle }
  } = track
  const isPurchased = stage === PurchaseContentStage.FINISH
  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(title, handle)
      const analytics = make(Name.PURCHASE_CONTENT_TWITTER_SHARE, {
        text: shareText
      })
      return { shareText, analytics }
    },
    [title]
  )

  const { amountDue } = purchaseSummaryValues
  if (isPurchased) {
    return (
      <>
        <TwitterShareButton
          fullWidth
          type='dynamic'
          url={fullTrackPage(permalink)}
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
        {error ? <ContentPurchaseError /> : null}
      </>
    )
  }

  return (
    <>
      <HarmonyButton
        disabled={isUnlocking}
        color='specialLightGreen'
        type='submit'
        text={getButtonContent(isUnlocking, amountDue)}
        fullWidth
      />
      {error ? <ContentPurchaseError /> : null}
    </>
  )
}
