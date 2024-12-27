import { useCallback, useEffect } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  Name,
  FollowSource,
  ModalSource,
  Chain,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  ID,
  AccessConditions,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  cacheUsersSelectors,
  usersSocialActions as socialActions,
  tippingActions,
  usePremiumContentPurchaseModal,
  gatedContentSelectors,
  PurchaseableContentType
} from '@audius/common/store'
import {
  formatPrice,
  removeNullable,
  Nullable,
  route
} from '@audius/common/utils'
import {
  Flex,
  Text,
  IconExternalLink,
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  IconLogoCircleETH,
  IconLogoCircleSOL,
  useTheme,
  Button,
  IconUserFollow,
  IconTipping
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useModalState } from 'common/hooks/useModalState'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { UserLink } from 'components/link'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import UserBadges from 'components/user-badges/UserBadges'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import { emptyStringGuard } from 'pages/track-page/utils'
import { make, track } from 'services/analytics'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'

import { LockedStatusBadge } from '../locked-status-badge'

import styles from './GiantTrackTile.module.css'
const { profilePage } = route

const { getUsers } = cacheUsersSelectors
const { beginTip } = tippingActions
const { getGatedContentStatusMap } = gatedContentSelectors

const getMessages = (contentType: PurchaseableContentType) => ({
  howToUnlock: 'HOW TO UNLOCK',
  payToUnlock: 'PAY TO UNLOCK',
  purchasing: 'PURCHASING',
  unlocking: 'UNLOCKING',
  unlocked: 'UNLOCKED',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  goToCollection: 'Open Collection',
  sendTip: 'Send Tip',
  followArtist: 'Follow Artist',
  period: '.',
  exclamationMark: '!',
  ownCollectibleGatedPrefix:
    'Users can unlock access by linking a wallet containing a collectible from ',
  unlockCollectibleGatedContent: `To unlock this ${contentType}, you must link a wallet containing a collectible from `,
  aCollectibleFrom: 'A Collectible from ',
  unlockingCollectibleGatedContentSuffix: 'was found in a linked wallet.',
  unlockedCollectibleGatedContentSuffix: `was found in a linked wallet. This ${contentType} is now available.`,
  ownFollowGated: 'Users can unlock access by following your account!',
  unlockFollowGatedContentPrefix: 'Follow',
  thankYouForFollowing: 'Thank you for following',
  unlockedFollowGatedContentSuffix: `! This ${contentType} is now available.`,
  ownTipGated: 'Users can unlock access by sending you a tip!',
  unlockTipGatedContentPrefix: 'Send',
  unlockTipGatedContentSuffix: 'a tip.',
  thankYouForSupporting: 'Thank you for supporting',
  unlockingTipGatedContentSuffix: 'by sending them a tip!',
  unlockedTipGatedContentSuffix: `by sending them a tip! This ${contentType} is now available.`,
  unlockWithPurchase: `Unlock this ${contentType} with a one-time purchase!`,
  purchased: `You've purchased this ${contentType}.`,
  buy: (price: string) => `Buy $${price}`,
  usersCanPurchase: (price: string) =>
    `Users can unlock access to this ${contentType} for a one time purchase of $${price}`
})

type GatedContentAccessSectionProps = {
  contentId: ID
  contentType: PurchaseableContentType
  trackOwner: Nullable<User>
  streamConditions: AccessConditions
  followee: Nullable<User>
  tippedUser: Nullable<User>
  goToCollection: () => void
  renderArtist: (entity: User) => JSX.Element
  isOwner: boolean
  className?: string
  buttonClassName?: string
  source?: ModalSource
}

const LockedGatedContentSection = ({
  contentId,
  contentType,
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className,
  buttonClassName,
  source: premiumModalSource
}: GatedContentAccessSectionProps) => {
  const messages = getMessages(contentType)
  const dispatch = useDispatch()
  const [lockedContentModalVisibility, setLockedContentModalVisibility] =
    useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const tipSource = lockedContentModalVisibility
    ? 'howToUnlockModal'
    : 'howToUnlockTrackPage'
  const followSource = lockedContentModalVisibility
    ? FollowSource.HOW_TO_UNLOCK_MODAL
    : FollowSource.HOW_TO_UNLOCK_TRACK_PAGE
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const { spacing } = useTheme()
  const [searchParams] = useSearchParams()
  const openCheckout = searchParams.get('checkout') === 'true'

  const { isEnabled: isGuestCheckoutEnabled } = useFeatureFlag(
    FeatureFlags.GUEST_CHECKOUT
  )

  const handlePurchase = useRequiresAccountCallback(() => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal(
      { contentId, contentType },
      { source: premiumModalSource ?? ModalSource.TrackDetails }
    )
  }, [
    contentId,
    contentType,
    lockedContentModalVisibility,
    openPremiumContentPurchaseModal,
    setLockedContentModalVisibility,
    premiumModalSource
  ])

  const handlePurchaseViaGuestCheckout = useCallback(() => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal(
      { contentId, contentType },
      { source: premiumModalSource ?? ModalSource.TrackDetails }
    )
  }, [
    contentId,
    contentType,
    lockedContentModalVisibility,
    openPremiumContentPurchaseModal,
    setLockedContentModalVisibility,
    premiumModalSource
  ])

  useEffect(() => {
    if (openCheckout && isUSDCPurchaseGated) {
      if (isGuestCheckoutEnabled) {
        handlePurchaseViaGuestCheckout()
      } else {
        handlePurchase()
      }
    }
  }, [
    openCheckout,
    handlePurchase,
    isUSDCPurchaseGated,
    isGuestCheckoutEnabled,
    handlePurchaseViaGuestCheckout
  ])

  const handleSendTip = useRequiresAccountCallback(() => {
    dispatch(
      beginTip({ user: tippedUser, source: tipSource, trackId: contentId })
    )

    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
  }, [
    dispatch,
    tippedUser,
    tipSource,
    contentId,
    lockedContentModalVisibility,
    setLockedContentModalVisibility
  ])

  const handleFollow = useRequiresAccountCallback(() => {
    if (isContentFollowGated(streamConditions)) {
      dispatch(
        socialActions.followUser(
          streamConditions.follow_user_id,
          followSource,
          contentId
        )
      )
    }

    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
  }, [
    dispatch,
    streamConditions,
    followSource,
    contentId,
    lockedContentModalVisibility,
    setLockedContentModalVisibility
  ])

  const renderLockedDescription = () => {
    if (isContentCollectibleGated(streamConditions)) {
      const { nft_collection } = streamConditions
      const { imageUrl, name, chain } = nft_collection
      const ChainIcon =
        chain === Chain.Eth ? IconLogoCircleETH : IconLogoCircleSOL
      return (
        <Text variant='body' strength='strong'>
          <div className={styles.collectibleGatedDescription}>
            {messages.unlockCollectibleGatedContent}
          </div>
          <div
            className={styles.gatedContentSectionCollection}
            onClick={goToCollection}
          >
            {imageUrl && (
              <div className={styles.collectionIconsContainer}>
                <img
                  src={imageUrl}
                  alt={`${name} nft collection`}
                  className={styles.collectibleImage}
                />
                <ChainIcon css={{ position: 'relative', left: -spacing.s }} />
              </div>
            )}
            <span>{name}</span>
          </div>
        </Text>
      )
    }

    if (isContentFollowGated(streamConditions) && followee) {
      return (
        <Text variant='body' strength='strong'>
          {messages.unlockFollowGatedContentPrefix}&nbsp;
          <UserLink userId={followee.user_id} />
          {messages.period}
        </Text>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return (
        <Text variant='body' strength='strong'>
          {messages.unlockTipGatedContentPrefix}&nbsp;
          <UserLink userId={tippedUser.user_id} />
          {messages.unlockTipGatedContentSuffix}
        </Text>
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <Text variant='body' strength='strong' textAlign='left'>
          {messages.unlockWithPurchase}
        </Text>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }

  const renderButton = () => {
    if (isContentCollectibleGated(streamConditions)) {
      return (
        <Button
          variant='primary'
          color='blue'
          onClick={goToCollection}
          iconRight={IconExternalLink}
          fullWidth
        >
          {messages.goToCollection}
        </Button>
      )
    }

    if (isContentFollowGated(streamConditions)) {
      return (
        <Button
          variant='primary'
          color='blue'
          onClick={handleFollow}
          iconLeft={IconUserFollow}
          fullWidth
        >
          {messages.followArtist}
        </Button>
      )
    }

    if (isContentTipGated(streamConditions)) {
      return (
        <Button
          variant='primary'
          color='blue'
          onClick={handleSendTip}
          iconRight={IconTipping}
          fullWidth
        >
          {messages.sendTip}
        </Button>
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <Button
          variant='primary'
          color='lightGreen'
          onClick={() => {
            track(
              make({
                eventName: Name.PURCHASE_CONTENT_BUY_CLICKED,
                contentId,
                contentType
              })
            )
            if (isGuestCheckoutEnabled) {
              handlePurchaseViaGuestCheckout()
            } else {
              handlePurchase()
            }
          }}
          fullWidth
        >
          {messages.buy(formatPrice(streamConditions.usdc_purchase.price))}
        </Button>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }

  return (
    <Flex className={className} justifyContent='space-between'>
      <Flex gap='s' direction='column'>
        <Flex alignItems='center' gap='s'>
          <LockedStatusBadge
            locked
            variant={isUSDCPurchaseGated ? 'premium' : 'gated'}
          />
          <Text variant='label' size='l' strength='strong'>
            {isUSDCPurchaseGated ? messages.payToUnlock : messages.howToUnlock}
          </Text>
        </Flex>
        {renderLockedDescription()}
      </Flex>
      <div className={cn(styles.gatedContentSectionButton, buttonClassName)}>
        {renderButton()}
      </div>
    </Flex>
  )
}

const UnlockingGatedContentSection = ({
  contentType,
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className
}: GatedContentAccessSectionProps) => {
  const messages = getMessages(contentType)
  const renderUnlockingDescription = () => {
    if (isContentCollectibleGated(streamConditions)) {
      return (
        <div>
          <span>{messages.aCollectibleFrom}</span>
          <span className={styles.collectibleName} onClick={goToCollection}>
            &nbsp;{streamConditions.nft_collection?.name}&nbsp;
          </span>
          <span>{messages.unlockingCollectibleGatedContentSuffix}</span>
        </div>
      )
    }

    if (isContentFollowGated(streamConditions) && followee) {
      return (
        <Text>
          {messages.thankYouForFollowing}
          <UserLink userId={followee.user_id} />
          {messages.exclamationMark}
        </Text>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return (
        <div>
          <span>{messages.thankYouForSupporting}&nbsp;</span>
          {renderArtist(tippedUser)}
          <span className={styles.suffix}>
            {messages.unlockingTipGatedContentSuffix}
          </span>
        </div>
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <Text variant='body' strength='strong'>
          {messages.unlockWithPurchase}
        </Text>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }

  return (
    <div className={className}>
      <Flex
        direction='row'
        className={styles.gatedContentDescriptionContainer}
        alignItems='flex-start'
        gap='s'
      >
        <Text variant='label' size='l' strength='strong'>
          <Flex alignItems='center' gap='s'>
            <LoadingSpinner className={styles.spinner} />
            {isContentUSDCPurchaseGated(streamConditions)
              ? messages.purchasing
              : messages.unlocking}
          </Flex>
        </Text>
        <Text variant='body' strength='strong'>
          {renderUnlockingDescription()}
        </Text>
      </Flex>
    </div>
  )
}

const UnlockedGatedContentSection = ({
  contentType,
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  isOwner,
  trackOwner,
  className
}: GatedContentAccessSectionProps) => {
  const messages = getMessages(contentType)
  const renderUnlockedDescription = () => {
    if (isContentCollectibleGated(streamConditions)) {
      return isOwner ? (
        <>
          {messages.ownCollectibleGatedPrefix}
          <span className={styles.collectibleName} onClick={goToCollection}>
            {streamConditions.nft_collection?.name}
          </span>
        </>
      ) : (
        <>
          {messages.aCollectibleFrom}
          <span className={styles.collectibleName} onClick={goToCollection}>
            {streamConditions.nft_collection?.name}
          </span>
          &nbsp;
          {messages.unlockedCollectibleGatedContentSuffix}
        </>
      )
    }

    if (isContentFollowGated(streamConditions) && followee) {
      return isOwner ? (
        messages.ownFollowGated
      ) : (
        <>
          {messages.thankYouForFollowing}&nbsp;
          <UserLink userId={followee.user_id} />
          {messages.unlockedFollowGatedContentSuffix}
        </>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return isOwner ? (
        messages.ownTipGated
      ) : (
        <>
          {messages.thankYouForSupporting}&nbsp;
          <UserLink userId={tippedUser.user_id} />
          {messages.unlockedTipGatedContentSuffix}
        </>
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return isOwner ? (
        <div>
          <span>
            {messages.usersCanPurchase(
              formatPrice(streamConditions.usdc_purchase.price)
            )}
          </span>
        </div>
      ) : (
        <Flex direction='row' wrap='wrap'>
          <span>{messages.purchased}&nbsp;</span>
          {trackOwner ? (
            <>
              <Flex direction='row'>
                {messages.thankYouForSupporting}&nbsp;
                {renderArtist(trackOwner)}
                {messages.period}
              </Flex>
            </>
          ) : null}
        </Flex>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }

  let IconComponent = IconSpecialAccess
  let gatedConditionTitle = messages.specialAccess

  if (isContentCollectibleGated(streamConditions)) {
    IconComponent = IconCollectible
    gatedConditionTitle = messages.collectibleGated
  } else if (isContentUSDCPurchaseGated(streamConditions)) {
    IconComponent = IconCart
    gatedConditionTitle = messages.payToUnlock
  }

  return (
    <div className={className}>
      <Text
        variant='label'
        size='l'
        strength='strong'
        className={cn(styles.gatedContentSectionTitle, {
          [styles.isOwner]: isOwner
        })}
      >
        {isOwner ? (
          <IconComponent className={styles.gatedContentIcon} />
        ) : (
          <LockedStatusBadge
            locked={false}
            variant={
              isContentUSDCPurchaseGated(streamConditions) ? 'premium' : 'gated'
            }
          />
        )}
        {isOwner ? gatedConditionTitle : messages.unlocked}
      </Text>
      <Text
        variant='body'
        strength='strong'
        className={styles.gatedContentSectionDescription}
      >
        {renderUnlockedDescription()}
      </Text>
    </div>
  )
}

type GatedContentSectionProps = {
  isLoading: boolean
  contentId: ID
  contentType: PurchaseableContentType
  streamConditions: AccessConditions
  hasStreamAccess?: boolean
  isOwner: boolean
  wrapperClassName?: string
  className?: string
  buttonClassName?: string
  ownerId: ID | null
  /** More context for analytics to know about where purchases are being triggered from */
  source?: ModalSource
}

export const GatedContentSection = ({
  isLoading,
  contentId,
  contentType = PurchaseableContentType.TRACK,
  streamConditions,
  hasStreamAccess,
  isOwner,
  wrapperClassName,
  className,
  buttonClassName,
  ownerId,
  source
}: GatedContentSectionProps) => {
  const dispatch = useDispatch()
  const gatedContentStatusMap = useSelector(getGatedContentStatusMap)
  const gatedContentStatus = gatedContentStatusMap[contentId] ?? null

  const isFollowGated = isContentFollowGated(streamConditions)
  const isTipGated = isContentTipGated(streamConditions)
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const shouldDisplay =
    isFollowGated ||
    isTipGated ||
    isContentCollectibleGated(streamConditions) ||
    isUSDCPurchaseGated
  const users = useSelector<AppState, { [id: ID]: User }>((state) =>
    getUsers(state, {
      ids: [
        isFollowGated ? streamConditions.follow_user_id : null,
        isTipGated ? streamConditions.tip_user_id : null,
        isUSDCPurchaseGated ? ownerId : null
      ].filter(removeNullable)
    })
  )
  const followee = isFollowGated ? users[streamConditions.follow_user_id] : null
  const trackOwner =
    isUSDCPurchaseGated && ownerId !== null ? users[ownerId] : null
  const tippedUser = isTipGated ? users[streamConditions.tip_user_id] : null

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  const handleGoToCollection = useCallback(() => {
    if (!isContentCollectibleGated(streamConditions)) return
    const { chain, address, externalLink } =
      streamConditions.nft_collection ?? {}
    if (chain === Chain.Eth && 'slug' in streamConditions.nft_collection!) {
      const url = `https://opensea.io/collection/${streamConditions.nft_collection.slug}`
      window.open(url, '_blank')
    } else if (chain === Chain.Sol) {
      if (externalLink) {
        const url = new URL(externalLink)
        window.open(`${url.protocol}//${url.hostname}`)
      } else {
        const explorerUrl = `https://explorer.solana.com/address/${address}`
        window.open(explorerUrl, '_blank')
      }
    }
  }, [streamConditions])

  const renderArtist = useCallback(
    (entity: User) => (
      <ArtistPopover
        handle={entity.handle}
        mouseEnterDelay={0.1}
        component='span'
      >
        <Flex gap='xs' alignItems='center'>
          <h2
            className={styles.gatedContentOwner}
            onClick={() =>
              dispatch(push(profilePage(emptyStringGuard(entity.handle))))
            }
          >
            {entity.name}
          </h2>
          <UserBadges
            userId={entity.user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
        </Flex>
      </ArtistPopover>
    ),
    [dispatch]
  )

  if (!streamConditions) return null
  if (!shouldDisplay) return null

  if (hasStreamAccess) {
    return (
      <div className={cn(styles.gatedContentSection, fadeIn, wrapperClassName)}>
        <UnlockedGatedContentSection
          contentId={contentId}
          contentType={contentType}
          trackOwner={trackOwner}
          streamConditions={streamConditions}
          followee={followee}
          tippedUser={tippedUser}
          goToCollection={handleGoToCollection}
          renderArtist={renderArtist}
          isOwner={isOwner}
          className={className}
        />
      </div>
    )
  }

  if (gatedContentStatus === 'UNLOCKING') {
    return (
      <div className={cn(styles.gatedContentSection, fadeIn, wrapperClassName)}>
        <UnlockingGatedContentSection
          contentId={contentId}
          contentType={contentType}
          trackOwner={trackOwner}
          streamConditions={streamConditions}
          followee={followee}
          tippedUser={tippedUser}
          goToCollection={handleGoToCollection}
          renderArtist={renderArtist}
          isOwner={isOwner}
          className={className}
        />
      </div>
    )
  }

  return (
    <div className={cn(styles.gatedContentSection, fadeIn, wrapperClassName)}>
      <LockedGatedContentSection
        contentId={contentId}
        contentType={contentType}
        trackOwner={trackOwner}
        streamConditions={streamConditions}
        followee={followee}
        tippedUser={tippedUser}
        goToCollection={handleGoToCollection}
        renderArtist={renderArtist}
        isOwner={isOwner}
        className={cn(styles.gatedContentSectionLocked, className)}
        buttonClassName={buttonClassName}
        source={source}
      />
    </div>
  )
}
