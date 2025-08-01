import { useCallback } from 'react'

import {
  GUEST_CHECKOUT,
  PurchaseableContentMetadata,
  isPurchaseableAlbum,
  usePurchaseContentErrorMessage
} from '@audius/common/hooks'
import { Name, RepostSource } from '@audius/common/models'
import {
  PurchaseContentError,
  tracksSocialActions,
  collectionsSocialActions,
  usePremiumContentPurchaseModal,
  PurchaseContentStage
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  Button,
  IconCaretRight,
  IconError,
  Text,
  PlainButton,
  IconRepost,
  Flex,
  Divider
} from '@audius/harmony'
import { useField } from 'formik'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { SignOnLink } from 'components/SignOnLink'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { fullCollectionPage, fullTrackPage } from 'utils/route'

import { PurchaseContentFormState } from '../hooks/usePurchaseContentFormState'

import styles from './PurchaseContentFormFooter.module.css'

const messages = {
  buy: 'Buy',
  viewContent: (contentType: 'track' | 'album') =>
    `View ${capitalize(contentType)}`,
  purchasing: 'Purchasing',
  shareButtonContent: 'I just purchased a track on Audius!',
  shareXText: (contentType: string, title: string, handle: string) =>
    `I bought the ${contentType} ${title} by ${handle} on @Audius! $AUDIO`,
  reposted: 'Reposted',
  repost: 'Repost',
  finishSigningUp: 'Finish Signing Up',
  finishSettingUpYourAccount: 'Finish setting up your free Audius account now!',
  finishSigningUpDescription:
    'An Audius account will let you easily access your purchases, upload music, interact with others, leave comments, curate playlists, and more! '
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

const getButtonText = (
  isUnlocking: boolean,
  amountDue: number,
  isGuest?: boolean
) =>
  isUnlocking
    ? messages.purchasing
    : amountDue > 0
      ? isGuest
        ? `Guest Purchase For ${USDC(amountDue / 100).toLocaleString()}`
        : `${messages.buy} ${USDC(amountDue / 100).toLocaleString()}`
      : messages.buy

type PurchaseContentFormFooterProps = Pick<
  PurchaseContentFormState,
  'error' | 'isUnlocking' | 'purchaseSummaryValues' | 'stage'
> & {
  metadata: PurchaseableContentMetadata
  onViewContentClicked: () => void
  isGuest?: boolean
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
  const isAlbum = isPurchaseableAlbum(metadata)
  const isHidden = isAlbum ? metadata.is_private : metadata.is_unlisted
  const dispatch = useDispatch()
  const isPurchased = stage === PurchaseContentStage.FINISH
  const { totalPrice } = purchaseSummaryValues
  const [{ value: isGuestCheckout }] = useField(GUEST_CHECKOUT)

  const handleXShare = useCallback(
    (handle: string) => {
      const title =
        'title' in metadata ? metadata.title : metadata.playlist_name
      const shareText = messages.shareXText(
        isAlbum ? 'album' : 'track',
        title,
        handle
      )
      const analytics = make(Name.PURCHASE_CONTENT_TWITTER_SHARE, {
        text: shareText
      })
      return { shareText, analytics }
    },
    [isAlbum, metadata]
  )
  const { onClose } = usePremiumContentPurchaseModal()

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
        <Flex gap='l'>
          {isGuestCheckout ? (
            <Flex direction='column'>
              <Divider />
              <Flex mv='xl' direction='column'>
                <Text variant='title'>
                  {messages.finishSettingUpYourAccount}
                </Text>
                <Text>{messages.finishSigningUpDescription}</Text>
              </Flex>
              <Flex gap='s'>
                <Button fullWidth asChild>
                  <SignOnLink signUp onClick={onClose}>
                    {messages.finishSigningUp}
                  </SignOnLink>
                </Button>
                <Button
                  fullWidth
                  variant='secondary'
                  onClick={onViewTrackClicked}
                >
                  {messages.viewContent(isAlbum ? 'album' : 'track')}
                </Button>
              </Flex>
            </Flex>
          ) : (
            <>
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
              {!isHidden && permalink ? (
                <XShareButton
                  fullWidth
                  type='dynamic'
                  size='default'
                  url={
                    isAlbum
                      ? fullCollectionPage(handle, null, null, permalink)
                      : fullTrackPage(permalink)
                  }
                  shareData={handleXShare}
                  handle={handle}
                />
              ) : null}
            </>
          )}
        </Flex>
        {isGuestCheckout ? null : (
          <PlainButton
            onClick={onViewTrackClicked}
            iconRight={IconCaretRight}
            variant='subdued'
            size='large'
          >
            {messages.viewContent(isAlbum ? 'album' : 'track')}
          </PlainButton>
        )}
      </Flex>
    )
  }

  return (
    <>
      <Button
        disabled={isUnlocking}
        color={'lightGreen'}
        type='submit'
        isLoading={isUnlocking}
        fullWidth
      >
        {getButtonText(isUnlocking, totalPrice, isGuestCheckout)}
      </Button>
      {error ? <ContentPurchaseError error={error} /> : null}
    </>
  )
}
