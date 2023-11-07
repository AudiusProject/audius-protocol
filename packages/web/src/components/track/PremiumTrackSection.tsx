import { useCallback } from 'react'

import {
  cacheUsersSelectors,
  Chain,
  FollowSource,
  formatPrice,
  ID,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated,
  Nullable,
  PremiumConditions,
  premiumContentSelectors,
  removeNullable,
  tippingActions,
  User,
  usersSocialActions as socialActions,
  usePremiumContentPurchaseModal
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  LogoEth,
  LogoSol
} from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import IconExternalLink from 'assets/img/iconExternalLink.svg'
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
const { getPremiumTrackStatusMap } = premiumContentSelectors

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

type PremiumTrackAccessSectionProps = {
  trackId: ID
  trackOwner: Nullable<User>
  premiumConditions: PremiumConditions
  followee: Nullable<User>
  tippedUser: Nullable<User>
  goToCollection: () => void
  renderArtist: (entity: User) => JSX.Element
  isOwner: boolean
  className?: string
  buttonClassName?: string
}

const LockedPremiumTrackSection = ({
  trackId,
  premiumConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className,
  buttonClassName
}: PremiumTrackAccessSectionProps) => {
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
  const isUSDCPurchaseGated =
    isPremiumContentUSDCPurchaseGated(premiumConditions)

  const handlePurchase = useAuthenticatedCallback(() => {
    if (lockedContentModalVisibility) {
      setLockedContentModalVisibility(false)
    }
    openPremiumContentPurchaseModal({ contentId: trackId })
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
    if (isPremiumContentFollowGated(premiumConditions)) {
      dispatch(
        socialActions.followUser(
          premiumConditions.follow_user_id,
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
    premiumConditions,
    followSource,
    trackId,
    lockedContentModalVisibility,
    setLockedContentModalVisibility
  ])

  const renderLockedDescription = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
          )}
        >
          <div className={styles.collectibleGatedDescription}>
            {messages.unlockCollectibleGatedTrack}
          </div>
          <div
            className={styles.premiumContentSectionCollection}
            onClick={goToCollection}
          >
            {premiumConditions.nft_collection?.imageUrl && (
              <div className={styles.collectionIconsContainer}>
                <img
                  src={premiumConditions.nft_collection.imageUrl}
                  alt={`${premiumConditions.nft_collection.name} nft collection`}
                />
                {premiumConditions.nft_collection.chain === Chain.Eth ? (
                  <LogoEth className={styles.collectionChainIcon} />
                ) : (
                  <LogoSol className={styles.collectionChainIcon} />
                )}
              </div>
            )}
            <span>{premiumConditions.nft_collection?.name}</span>
          </div>
        </div>
      )
    }

    if (isPremiumContentFollowGated(premiumConditions) && followee) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
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

    if (isPremiumContentTipGated(premiumConditions) && tippedUser) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
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

    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
          )}
        >
          {messages.unlockWithPurchase}
        </div>
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, followee, tippedUser, goToCollection, renderArtist])

  const renderButton = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
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

    if (isPremiumContentFollowGated(premiumConditions)) {
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

    if (isPremiumContentTipGated(premiumConditions)) {
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

    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      return (
        <Button
          color='specialLightGreen'
          text={messages.buy(
            formatPrice(premiumConditions.usdc_purchase.price)
          )}
          onClick={handlePurchase}
          type={ButtonType.PRIMARY}
          textClassName={styles.buttonText}
        />
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [
    premiumConditions,
    goToCollection,
    handleFollow,
    handleSendTip,
    handlePurchase
  ])

  return (
    <div className={className}>
      <div className={styles.premiumContentDescriptionContainer}>
        <div
          className={cn(
            typeStyles.labelLarge,
            typeStyles.labelStrong,
            styles.premiumContentSectionTitle
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
      <div className={cn(styles.premiumContentSectionButton, buttonClassName)}>
        {renderButton()}
      </div>
    </div>
  )
}

const UnlockingPremiumTrackSection = ({
  premiumConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  className
}: PremiumTrackAccessSectionProps) => {
  const renderUnlockingDescription = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      return (
        <div>
          <span>{messages.aCollectibleFrom}</span>
          <span className={styles.collectibleName} onClick={goToCollection}>
            &nbsp;{premiumConditions.nft_collection?.name}&nbsp;
          </span>
          <span>{messages.unlockingCollectibleGatedTrackSuffix}</span>
        </div>
      )
    }

    if (isPremiumContentFollowGated(premiumConditions) && followee) {
      return (
        <div>
          <span>{messages.thankYouForFollowing}&nbsp;</span>
          {renderArtist(followee)}
          <span>{messages.exclamationMark}</span>
        </div>
      )
    }

    if (isPremiumContentTipGated(premiumConditions) && tippedUser) {
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

    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      return (
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
          )}
        >
          {messages.unlockWithPurchase}
        </div>
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, followee, tippedUser, goToCollection, renderArtist])

  return (
    <div className={className}>
      <div className={styles.premiumContentDescriptionContainer}>
        <div
          className={cn(
            typeStyles.labelLarge,
            typeStyles.labelStrong,
            styles.premiumContentSectionTitle
          )}
        >
          <LoadingSpinner className={styles.spinner} />
          {isPremiumContentUSDCPurchaseGated(premiumConditions)
            ? messages.purchasing
            : messages.unlocking}
        </div>
        <div
          className={cn(
            typeStyles.bodyMedium,
            typeStyles.bodyStrong,
            styles.premiumContentSectionDescription
          )}
        >
          {renderUnlockingDescription()}
        </div>
      </div>
    </div>
  )
}

const UnlockedPremiumTrackSection = ({
  premiumConditions,
  followee,
  tippedUser,
  goToCollection,
  renderArtist,
  isOwner,
  trackOwner,
  className
}: PremiumTrackAccessSectionProps) => {
  const renderUnlockedDescription = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      return isOwner ? (
        <div>
          <span>
            {messages.ownCollectibleGatedPrefix}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {premiumConditions.nft_collection?.name}
            </span>
          </span>
        </div>
      ) : (
        <div>
          <span>
            {messages.aCollectibleFrom}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {premiumConditions.nft_collection?.name}
            </span>
            &nbsp;
          </span>
          <span>{messages.unlockedCollectibleGatedTrackSuffix}</span>
        </div>
      )
    }

    if (isPremiumContentFollowGated(premiumConditions) && followee) {
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

    if (isPremiumContentTipGated(premiumConditions) && tippedUser) {
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

    if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
      return isOwner ? (
        <div>
          <span>
            {messages.usersCanPurchase(
              formatPrice(premiumConditions.usdc_purchase.price)
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
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [
    premiumConditions,
    isOwner,
    trackOwner,
    followee,
    tippedUser,
    goToCollection,
    renderArtist
  ])

  let IconComponent = IconSpecialAccess
  let gatedConditionTitle = messages.specialAccess

  if (isPremiumContentCollectibleGated(premiumConditions)) {
    IconComponent = IconCollectible
    gatedConditionTitle = messages.collectibleGated
  } else if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
    IconComponent = IconCart
    gatedConditionTitle = messages.payToUnlock
  }

  return (
    <div className={className}>
      <div
        className={cn(
          typeStyles.labelLarge,
          typeStyles.labelStrong,
          styles.premiumContentSectionTitle,
          { [styles.isOwner]: isOwner }
        )}
      >
        {isOwner ? (
          <IconComponent className={styles.gatedContentIcon} />
        ) : (
          <LockedStatusBadge
            locked={false}
            variant={
              isPremiumContentUSDCPurchaseGated(premiumConditions)
                ? 'premium'
                : 'gated'
            }
          />
        )}
        {isOwner ? gatedConditionTitle : messages.unlocked}
      </div>
      <div
        className={cn(
          typeStyles.bodyMedium,
          typeStyles.bodyStrong,
          styles.premiumContentSectionDescription
        )}
      >
        {renderUnlockedDescription()}
      </div>
    </div>
  )
}

type PremiumTrackSectionProps = {
  isLoading: boolean
  trackId: ID
  premiumConditions: PremiumConditions
  doesUserHaveAccess: boolean
  isOwner: boolean
  wrapperClassName?: string
  className?: string
  buttonClassName?: string
  ownerId: ID
}

export const PremiumTrackSection = ({
  isLoading,
  trackId,
  premiumConditions,
  doesUserHaveAccess,
  isOwner,
  wrapperClassName,
  className,
  buttonClassName,
  ownerId
}: PremiumTrackSectionProps) => {
  const dispatch = useDispatch()
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = premiumTrackStatusMap[trackId] ?? null

  const isFollowGated = isPremiumContentFollowGated(premiumConditions)
  const isTipGated = isPremiumContentTipGated(premiumConditions)
  const isUSDCPurchaseGated =
    isPremiumContentUSDCPurchaseGated(premiumConditions)
  const shouldDisplay =
    isFollowGated ||
    isTipGated ||
    isPremiumContentCollectibleGated(premiumConditions) ||
    isUSDCPurchaseGated
  const users = useSelector<AppState, { [id: ID]: User }>((state) =>
    getUsers(state, {
      ids: [
        isFollowGated ? premiumConditions.follow_user_id : null,
        isTipGated ? premiumConditions.tip_user_id : null,
        isUSDCPurchaseGated ? ownerId : null
      ].filter(removeNullable)
    })
  )
  const followee = isFollowGated
    ? users[premiumConditions.follow_user_id]
    : null
  const trackOwner = isUSDCPurchaseGated ? users[ownerId] : null
  const tippedUser = isTipGated ? users[premiumConditions.tip_user_id] : null

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  const handleGoToCollection = useCallback(() => {
    if (!isPremiumContentCollectibleGated(premiumConditions)) return
    const { chain, address, externalLink } =
      premiumConditions.nft_collection ?? {}
    if (chain === Chain.Eth && 'slug' in premiumConditions.nft_collection!) {
      const url = `https://opensea.io/collection/${premiumConditions.nft_collection.slug}`
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
  }, [premiumConditions])

  const renderArtist = useCallback(
    (entity: User) => (
      <ArtistPopover
        handle={entity.handle}
        mouseEnterDelay={0.1}
        component='span'
      >
        <h2
          className={styles.premiumTrackOwner}
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

  if (!premiumConditions) return null
  if (!shouldDisplay) return null

  if (doesUserHaveAccess) {
    return (
      <div
        className={cn(styles.premiumContentSection, fadeIn, wrapperClassName)}
      >
        <UnlockedPremiumTrackSection
          trackId={trackId}
          trackOwner={trackOwner}
          premiumConditions={premiumConditions}
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

  if (premiumTrackStatus === 'UNLOCKING') {
    return (
      <div
        className={cn(styles.premiumContentSection, fadeIn, wrapperClassName)}
      >
        <UnlockingPremiumTrackSection
          trackId={trackId}
          trackOwner={trackOwner}
          premiumConditions={premiumConditions}
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
    <div className={cn(styles.premiumContentSection, fadeIn, wrapperClassName)}>
      <LockedPremiumTrackSection
        trackId={trackId}
        trackOwner={trackOwner}
        premiumConditions={premiumConditions}
        followee={followee}
        tippedUser={tippedUser}
        goToCollection={handleGoToCollection}
        renderArtist={renderArtist}
        isOwner={isOwner}
        className={cn(styles.premiumContentSectionLocked, className)}
        buttonClassName={buttonClassName}
      />
    </div>
  )
}
