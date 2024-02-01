import { useCallback } from 'react'

import {
  cacheUsersSelectors,
  Chain,
  FollowSource,
  formatPrice,
  ID,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  Nullable,
  AccessConditions,
  gatedContentSelectors,
  removeNullable,
  tippingActions,
  User,
  usersSocialActions as socialActions,
  usePremiumContentPurchaseModal,
  ModalSource
} from '@audius/common'
import {
  IconExternalLink,
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  IconSolana as LogoSol
} from '@audius/harmony'
import { Button, ButtonType, LogoEth } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { FollowButton } from 'components/follow-button/FollowButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { IconTip } from 'components/notification/Notification/components/icons'
import typeStyles from 'components/typography/typography.module.css'
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

  const renderLockedDescription = useCallback(() => {
    if (isContentCollectibleGated(streamConditions)) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          <div className={styles.collectibleGatedDescription}>
            {messages.unlockCollectibleGatedTrack}
          </div>
          <div
            className={styles.gatedContentSectionCollection}
            onClick={goToCollection}
          >
            {streamConditions.nft_collection?.imageUrl && (
              <div className={styles.collectionIconsContainer}>
                <img
                  src={streamConditions.nft_collection.imageUrl}
                  alt={`${streamConditions.nft_collection.name} nft collection`}
                />
                {streamConditions.nft_collection.chain === Chain.Eth ? (
                  <LogoEth className={styles.collectionChainIcon} />
                ) : (
                  <LogoSol className={styles.collectionChainIcon} />
                )}
              </div>
            )}
            <span>{streamConditions.nft_collection?.name}</span>
          </div>
        </div>
      )
    }

    if (isContentFollowGated(streamConditions) && followee) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          <div>
            <span>{messages.unlockFollowGatedTrackPrefix}&nbsp;</span>
            {renderArtist(followee)}
            <span>{messages.period}</span>
          </div>
        </div>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          <div>
            <span>{messages.unlockTipGatedTrackPrefix}&nbsp;</span>
            {renderArtist(tippedUser)}
            <span className={styles.suffix}>
              {messages.unlockTipGatedTrackSuffix}
            </span>
          </div>
        </div>
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          {messages.unlockWithPurchase}
        </div>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }, [streamConditions, followee, tippedUser, goToCollection, renderArtist])

  const renderButton = useCallback(() => {
    if (isContentCollectibleGated(streamConditions)) {
      return (
        <Button
          color='accentBlue'
          text={messages.goToCollection}
          onClick={goToCollection}
          rightIcon={<IconExternalLink />}
          type={ButtonType.PRIMARY}
          iconClassName={styles.buttonIcon}
          textClassName={styles.buttonText}
        />
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
          color='accentBlue'
          text={messages.sendTip}
          onClick={handleSendTip}
          rightIcon={<IconTip />}
          type={ButtonType.PRIMARY}
          iconClassName={styles.buttonIcon}
          textClassName={styles.buttonText}
        />
      )
    }

    if (isContentUSDCPurchaseGated(streamConditions)) {
      return (
        <Button
          color='specialLightGreen'
          text={messages.buy(formatPrice(streamConditions.usdc_purchase.price))}
          onClick={handlePurchase}
          type={ButtonType.PRIMARY}
          textClassName={styles.buttonText}
        />
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }, [
    streamConditions,
    goToCollection,
    handleFollow,
    handleSendTip,
    handlePurchase
  ])

  return (
    <div className={className}>
      <div className={styles.gatedContentDescriptionContainer}>
        <div
          className={cn(
            typeStyles.labelLarge,
            typeStyles.labelStrong,
            styles.gatedContentSectionTitle
          )}
        >
          <LockedStatusBadge
            locked
            variant={isUSDCPurchaseGated ? 'premium' : 'gated'}
          />
          {isUSDCPurchaseGated ? messages.payToUnlock : messages.howToUnlock}
        </div>
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
  const renderUnlockingDescription = useCallback(() => {
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
        <div>
          <span>{messages.thankYouForFollowing}&nbsp;</span>
          {renderArtist(followee)}
          <span>{messages.exclamationMark}</span>
        </div>
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
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          {messages.unlockWithPurchase}
        </div>
      )
    }

    console.warn(
      'No entity for stream conditions... should not have reached here.'
    )
    return null
  }, [streamConditions, followee, tippedUser, goToCollection, renderArtist])

  return (
    <div className={className}>
      <div className={styles.gatedContentDescriptionContainer}>
        <div
          className={cn(
            typeStyles.labelLarge,
            typeStyles.labelStrong,
            styles.gatedContentSectionTitle
          )}
        >
          <LoadingSpinner className={styles.spinner} />
          {isContentUSDCPurchaseGated(streamConditions)
            ? messages.purchasing
            : messages.unlocking}
        </div>
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.gatedContentSectionDescription
          )}
        >
          {renderUnlockingDescription()}
        </div>
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
  const renderUnlockedDescription = useCallback(() => {
    if (isContentCollectibleGated(streamConditions)) {
      return isOwner ? (
        <div>
          <span>
            {messages.ownCollectibleGatedPrefix}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {streamConditions.nft_collection?.name}
            </span>
          </span>
        </div>
      ) : (
        <div>
          <span>
            {messages.aCollectibleFrom}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {streamConditions.nft_collection?.name}
            </span>
            &nbsp;
          </span>
          <span>{messages.unlockedCollectibleGatedTrackSuffix}</span>
        </div>
      )
    }

    if (isContentFollowGated(streamConditions) && followee) {
      return isOwner ? (
        <div>
          <span>{messages.ownFollowGated}</span>
        </div>
      ) : (
        <div>
          <span>{messages.thankYouForFollowing}&nbsp;</span>
          {renderArtist(followee)}
          <span>{messages.unlockedFollowGatedTrackSuffix}</span>
        </div>
      )
    }

    if (isContentTipGated(streamConditions) && tippedUser) {
      return isOwner ? (
        <div>
          <span>{messages.ownTipGated}</span>
        </div>
      ) : (
        <div>
          <span>{messages.thankYouForSupporting}&nbsp;</span>
          {renderArtist(tippedUser)}
          <span className={styles.suffix}>
            {messages.unlockedTipGatedTrackSuffix}
          </span>
        </div>
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
  }, [
    streamConditions,
    isOwner,
    trackOwner,
    followee,
    tippedUser,
    goToCollection,
    renderArtist
  ])

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
      <div
        className={cn(
          typeStyles.labelLarge,
          typeStyles.labelStrong,
          styles.gatedContentSectionTitle,
          { [styles.isOwner]: isOwner }
        )}
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
      </div>
      <div
        className={cn(
          typeStyles.bodyMedium,
          typeStyles.bodyStrong,
          styles.gatedContentSectionDescription
        )}
      >
        {renderUnlockedDescription()}
      </div>
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
