import { useCallback } from 'react'

import {
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
import {
  cacheUsersSelectors,
  usersSocialActions as socialActions,
  tippingActions,
  usePremiumContentPurchaseModal,
  gatedContentSelectors
} from '@audius/common/store'
import { formatPrice, removeNullable, Nullable } from '@audius/common/utils'
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
  Button
} from '@audius/harmony'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { FollowButton } from 'components/follow-button/FollowButton'
import { UserLink } from 'components/link'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { IconTip } from 'components/notification/Notification/components/icons'
import UserBadges from 'components/user-badges/UserBadges'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'
import { emptyStringGuard } from 'pages/track-page/utils'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import styles from './GiantTrackTile.module.css'
import { LockedStatusBadge } from './LockedStatusBadge'

const { getUsers } = cacheUsersSelectors
const { beginTip } = tippingActions
const { getGatedTrackStatusMap } = gatedContentSelectors

const messages = {
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
  unlockCollectibleGatedTrack:
    'To unlock this track, you must link a wallet containing a collectible from ',
  aCollectibleFrom: 'A Collectible from ',
  unlockingCollectibleGatedTrackSuffix: 'was found in a linked wallet.',
  unlockedCollectibleGatedTrackSuffix:
    'was found in a linked wallet. This track is now available.',
  ownFollowGated: 'Users can unlock access by following your account!',
  unlockFollowGatedTrackPrefix: 'Follow',
  thankYouForFollowing: 'Thank you for following',
  unlockedFollowGatedTrackSuffix: '! This track is now available.',
  ownTipGated: 'Users can unlock access by sending you a tip!',
  unlockTipGatedTrackPrefix: 'Send',
  unlockTipGatedTrackSuffix: 'a tip.',
  thankYouForSupporting: 'Thank you for supporting',
  unlockingTipGatedTrackSuffix: 'by sending them a tip!',
  unlockedTipGatedTrackSuffix:
    'by sending them a tip! This track is now available.',
  unlockWithPurchase: 'Unlock this track with a one-time purchase!',
  purchased: "You've purchased this track.",
  buy: (price: string) => `Buy $${price}`,
  usersCanPurchase: (price: string) =>
    `Users can unlock access to this track for a one time purchase of $${price}`
}

type GatedTrackAccessSectionProps = {
  trackId: ID
  trackOwner: Nullable<User>
  streamConditions: AccessConditions
  followee: Nullable<User>
  tippedUser: Nullable<User>
  goToCollection: () => void
  renderArtist: (entity: User) => JSX.Element
  isOwner: boolean
  className?: string
  buttonClassName?: string
}

const LockedGatedTrackSection = ({
  trackId,
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className,
  buttonClassName
}: GatedTrackAccessSectionProps) => {
  const dispatch = useDispatch()
  const [lockedContentModalVisibility, setLockedContentModalVisibility] =
    useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const source = lockedContentModalVisibility
    ? 'howToUnlockModal'
    : 'howToUnlockTrackPage'
  const followSource = lockedContentModalVisibility
    ? FollowSource.HOW_TO_UNLOCK_MODAL
    : FollowSource.HOW_TO_UNLOCK_TRACK_PAGE
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const { spacing } = useTheme()

  const handlePurchase = useAuthenticatedCallback(() => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal(
      { contentId: trackId },
      { source: ModalSource.TrackDetails }
    )
  }, [
    trackId,
    lockedContentModalVisibility,
    openPremiumContentPurchaseModal,
    setLockedContentModalVisibility
  ])

  const handleSendTip = useAuthenticatedCallback(() => {
    dispatch(beginTip({ user: tippedUser, source, trackId }))

    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
  }, [
    dispatch,
    tippedUser,
    source,
    trackId,
    lockedContentModalVisibility,
    setLockedContentModalVisibility
  ])

  const handleFollow = useAuthenticatedCallback(() => {
    if (isContentFollowGated(streamConditions)) {
      dispatch(
        socialActions.followUser(
          streamConditions.follow_user_id,
          followSource,
          trackId
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
    trackId,
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
            {messages.unlockCollectibleGatedTrack}
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
          {messages.unlockFollowGatedTrackPrefix}&nbsp;
          <UserLink userId={followee.user_id} />
          {messages.period}
        </Text>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return (
        <Text variant='body' strength='strong'>
          {messages.unlockTipGatedTrackPrefix}&nbsp;
          <UserLink userId={tippedUser.user_id} />
          {messages.unlockTipGatedTrackSuffix}
        </Text>
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
        <FollowButton
          color='accentBlue'
          className={styles.followButton}
          messages={{
            follow: messages.followArtist,
            unfollow: '',
            following: ''
          }}
          onFollow={handleFollow}
          invertedColor
        />
      )
    }

    if (isContentTipGated(streamConditions)) {
      return (
        <Button
          variant='primary'
          color='blue'
          onClick={handleSendTip}
          iconRight={IconTip}
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
          onClick={handlePurchase}
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
    <div className={className}>
      <div className={styles.gatedContentDescriptionContainer}>
        <Flex alignItems='center' gap='s' mb='s'>
          <LockedStatusBadge
            locked
            variant={isUSDCPurchaseGated ? 'premium' : 'gated'}
          />
          <Text variant='label' size='l' strength='strong'>
            {isUSDCPurchaseGated ? messages.payToUnlock : messages.howToUnlock}
          </Text>
        </Flex>
        {renderLockedDescription()}
      </div>
      <div className={cn(styles.gatedContentSectionButton, buttonClassName)}>
        {renderButton()}
      </div>
    </div>
  )
}

const UnlockingGatedTrackSection = ({
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className
}: GatedTrackAccessSectionProps) => {
  const renderUnlockingDescription = () => {
    if (isContentCollectibleGated(streamConditions)) {
      return (
        <div>
          <span>{messages.aCollectibleFrom}</span>
          <span className={styles.collectibleName} onClick={goToCollection}>
            &nbsp;{streamConditions.nft_collection?.name}&nbsp;
          </span>
          <span>{messages.unlockingCollectibleGatedTrackSuffix}</span>
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
            {messages.unlockingTipGatedTrackSuffix}
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
      <div className={styles.gatedContentDescriptionContainer}>
        <Text variant='label' size='l' strength='strong'>
          <LoadingSpinner className={styles.spinner} />
          {isContentUSDCPurchaseGated(streamConditions)
            ? messages.purchasing
            : messages.unlocking}
        </Text>
        <Text variant='body' strength='strong'>
          {renderUnlockingDescription()}
        </Text>
      </div>
    </div>
  )
}

const UnlockedGatedTrackSection = ({
  streamConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  isOwner,
  trackOwner,
  className
}: GatedTrackAccessSectionProps) => {
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
          {messages.unlockedCollectibleGatedTrackSuffix}
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
          {messages.unlockedFollowGatedTrackSuffix}
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
          {messages.unlockedTipGatedTrackSuffix}
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
        <div>
          <span>{messages.purchased}&nbsp;</span>
          {trackOwner ? (
            <>
              <span>
                {messages.thankYouForSupporting}&nbsp;
                {renderArtist(trackOwner)}
                {messages.period}
              </span>
            </>
          ) : null}
        </div>
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

type GatedTrackSectionProps = {
  isLoading: boolean
  trackId: ID
  streamConditions: AccessConditions
  hasStreamAccess: boolean
  isOwner: boolean
  wrapperClassName?: string
  className?: string
  buttonClassName?: string
  ownerId: ID
}

export const GatedTrackSection = ({
  isLoading,
  trackId,
  streamConditions,
  hasStreamAccess,
  isOwner,
  wrapperClassName,
  className,
  buttonClassName,
  ownerId
}: GatedTrackSectionProps) => {
  const dispatch = useDispatch()
  const gatedTrackStatusMap = useSelector(getGatedTrackStatusMap)
  const gatedTrackStatus = gatedTrackStatusMap[trackId] ?? null

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
  const trackOwner = isUSDCPurchaseGated ? users[ownerId] : null
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
        <h2
          className={styles.gatedTrackOwner}
          onClick={() =>
            dispatch(pushRoute(profilePage(emptyStringGuard(entity.handle))))
          }
        >
          {entity.name}
          <UserBadges
            userId={entity.user_id}
            className={styles.badgeIcon}
            noContentClassName={styles.noContentBadgeIcon}
            badgeSize={14}
            useSVGTiers
          />
        </h2>
      </ArtistPopover>
    ),
    [dispatch]
  )

  if (!streamConditions) return null
  if (!shouldDisplay) return null

  if (hasStreamAccess) {
    return (
      <div className={cn(styles.gatedContentSection, fadeIn, wrapperClassName)}>
        <UnlockedGatedTrackSection
          trackId={trackId}
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

  if (gatedTrackStatus === 'UNLOCKING') {
    return (
      <div className={cn(styles.gatedContentSection, fadeIn, wrapperClassName)}>
        <UnlockingGatedTrackSection
          trackId={trackId}
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
      <LockedGatedTrackSection
        trackId={trackId}
        trackOwner={trackOwner}
        streamConditions={streamConditions}
        followee={followee}
        tippedUser={tippedUser}
        goToCollection={handleGoToCollection}
        renderArtist={renderArtist}
        isOwner={isOwner}
        className={cn(styles.gatedContentSectionLocked, className)}
        buttonClassName={buttonClassName}
      />
    </div>
  )
}
