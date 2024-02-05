import { useCallback } from 'react'

import {
  Name,
  PurchaseableTrackMetadata,
  PurchaseContentError,
  PurchaseContentStage,
  formatPrice,
  usePurchaseContentErrorMessage
} from '@audius/common'
import { Button } from '@audius/harmony'
import {
  HarmonyPlainButton,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType,
  IconCaretRight,
  IconError
} from '@audius/stems'

import { make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
import { Text } from 'components/typography'
import { fullTrackPage } from 'utils/route'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'

import styles from './PurchaseContentFormFooter.module.css'

const messages = {
  buy: 'Buy',
  viewTrack: 'View Track',
  purchasing: 'Purchasing',
  shareButtonContent: 'I just purchased a track on Audius!',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `I bought the track ${trackTitle} by ${handle} on @Audius! #AudiusPremium`,
  purchaseSuccessful: 'Your Purchase Was Successful!'
}

const ContentPurchaseError = ({
  error: { code }
}: {
  error: PurchaseContentError
}) => {
  return (
    <Text className={styles.errorContainer} color='accentRed'>
      <Icon icon={IconError} size='medium' />
      {usePurchaseContentErrorMessage(code)}
    </Text>
  )
}

const getButtonText = (isUnlocking: boolean, amountDue: number) =>
  isUnlocking
    ? messages.purchasing
    : amountDue > 0
    ? `${messages.buy} $${formatPrice(amountDue)}`
    : messages.buy

type PurchaseContentFormFooterProps = Pick<
  PurchaseContentFormState,
  'error' | 'isUnlocking' | 'purchaseSummaryValues' | 'stage'
> & {
  track: PurchaseableTrackMetadata
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
  const { totalPrice } = purchaseSummaryValues

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
      </>
    )
  }
  return (
    <>
      <Button
        disabled={isUnlocking}
        color='lightGreen'
        type={'submit'}
        isLoading={isUnlocking}
        fullWidth
      >
        {getButtonText(isUnlocking, totalPrice)}
      </Button>
      {error ? <ContentPurchaseError error={error} /> : null}
    </>
  )
}
