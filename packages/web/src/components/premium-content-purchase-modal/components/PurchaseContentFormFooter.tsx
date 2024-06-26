import { useCallback } from 'react'

import {
  PurchaseableContentMetadata,
  isPurchaseableAlbum,
  usePurchaseContentErrorMessage
} from '@audius/common/hooks'
import { Name, RepostSource } from '@audius/common/models'
import {
  PurchaseContentStage,
  PurchaseContentError,
  tracksSocialActions,
  collectionsSocialActions
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
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { TwitterShareButton } from 'components/twitter-share-button/TwitterShareButton'
import { fullCollectionPage, fullTrackPage } from 'utils/route'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'

import styles from './PurchaseContentFormFooter.module.css'

const messages = {
  buy: 'Buy',
  viewContent: (contentType: 'track' | 'album') =>
    `View ${capitalize(contentType)}`,
  purchasing: 'Purchasing',
  shareButtonContent: 'I just purchased a track on Audius!',
  shareTwitterText: (contentType: string, title: string, handle: string) =>
    `I bought the ${contentType} ${title} by ${handle} on @Audius! $AUDIO #AudiusPremium`,
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
  metadata: PurchaseableContentMetadata
  onViewContentClicked: () => void
}

export const PurchaseContentFormFooter = ({
  error,
  metadata,
  isUnlocking,
  purchaseSummaryValues,
  stage,
  onViewContentClicked: onViewTrackClicked
}: PurchaseContentFormFooterProps) => {
  const {
    permalink,
    user: { handle },
    has_current_user_reposted: isReposted
  } = metadata
  const contentId =
    'track_id' in metadata ? metadata.track_id : metadata.playlist_id
  const title = 'title' in metadata ? metadata.title : metadata.playlist_name
  const isAlbum = isPurchaseableAlbum(metadata)
  const isHidden = isAlbum ? metadata.is_private : metadata.is_unlisted
  const dispatch = useDispatch()
  const isPurchased = stage === PurchaseContentStage.FINISH
  const { totalPrice } = purchaseSummaryValues

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(
        isAlbum ? 'album' : 'track',
        title,
        handle
      )
      const analytics = make(Name.PURCHASE_CONTENT_TWITTER_SHARE, {
        text: shareText
      })
      return { shareText, analytics }
    },
    [title, isAlbum]
  )

  const onRepost = useCallback(() => {
    dispatch(
      isReposted
        ? (isAlbum
            ? collectionsSocialActions.undoRepostCollection
            : tracksSocialActions.undoRepostTrack)(
            contentId,
            RepostSource.PURCHASE
          )
        : (isAlbum
            ? collectionsSocialActions.repostCollection
            : tracksSocialActions.repostTrack)(contentId, RepostSource.PURCHASE)
    )
  }, [contentId, dispatch, isAlbum, isReposted])

  if (isPurchased) {
    return (
      <Flex direction='column' gap='xl' alignSelf='stretch'>
        {isHidden ? null : (
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
            {permalink ? (
              <TwitterShareButton
                fullWidth
                type='dynamic'
                url={
                  isAlbum
                    ? fullCollectionPage(handle, null, null, permalink)
                    : fullTrackPage(permalink)
                }
                shareData={handleTwitterShare}
                handle={handle}
              />
            ) : null}
          </Flex>
        )}
        <PlainButton
          onClick={onViewTrackClicked}
          iconRight={IconCaretRight}
          variant='subdued'
          size='large'
        >
          {messages.viewContent(isAlbum ? 'album' : 'track')}
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
