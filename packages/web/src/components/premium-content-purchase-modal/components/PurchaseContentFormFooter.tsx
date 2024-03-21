import { useCallback } from 'react'

import {
  PurchaseableTrackMetadata,
  usePurchaseContentErrorMessage
} from '@audius/common/hooks'
import { Name, RepostSource } from '@audius/common/models'
import {
  PurchaseContentStage,
  PurchaseContentError,
  tracksSocialActions
} from '@audius/common/store'
import { formatPrice } from '@audius/common/utils'
import {
  Button,
  IconCaretRight,
  IconError,
  Text,
  PlainButton,
  IconRepost,
  Flex
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
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
  reposted: 'Reposted',
  repost: 'Repost'
}

const ContentPurchaseError = ({
  error: { code }
}: {
  error: PurchaseContentError
}) => {
  return (
    <Text variant='body' className={styles.errorContainer} color='danger'>
      <IconError size='m' color='danger' />
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
    user: { handle },
    has_current_user_reposted: isReposted,
    track_id: trackId
  } = track
  const dispatch = useDispatch()
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

  const onRepost = useCallback(() => {
    dispatch(
      isReposted
        ? tracksSocialActions.undoRepostTrack(trackId, RepostSource.PURCHASE)
        : tracksSocialActions.repostTrack(trackId, RepostSource.PURCHASE)
    )
  }, [trackId, dispatch, isReposted])

  if (isPurchased) {
    return (
      <Flex direction='column' gap='xl' alignSelf='stretch'>
        <Flex gap='l'>
          <Button
            type='button'
            variant={isReposted ? 'primary' : 'secondary'}
            fullWidth
            iconLeft={IconRepost}
            onClick={onRepost}
            role='log'
          >
            {isReposted ? messages.reposted : messages.repost}
          </Button>
          <TwitterShareButton
            fullWidth
            type='dynamic'
            url={fullTrackPage(permalink)}
            shareData={handleTwitterShare}
            handle={handle}
          />
        </Flex>
        <PlainButton
          onClick={onViewTrackClicked}
          iconRight={IconCaretRight}
          variant='subdued'
          size='large'
        >
          {messages.viewTrack}
        </PlainButton>
      </Flex>
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
