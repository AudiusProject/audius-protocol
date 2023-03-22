import { useCallback } from 'react'

import {
  FeatureFlags,
  PremiumConditions,
  cacheUsersSelectors,
  User,
  ID,
  Nullable,
  Chain,
  usersSocialActions as socialActions,
  FollowSource,
  tippingActions,
  premiumContentSelectors,
  accountSelectors,
  removeNullable
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconCollectible,
  IconLock,
  IconSpecialAccess,
  IconUnlocked,
  LogoEth,
  LogoSol
} from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconExternalLink } from 'assets/img/iconExternalLink.svg'
import { ReactComponent as IconVerifiedGreen } from 'assets/img/iconVerifiedGreen.svg'
import { useModalState } from 'common/hooks/useModalState'
import { showRequiresAccountModal } from 'common/store/pages/signon/actions'
import FollowButton from 'components/follow-button/FollowButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { IconTip } from 'components/notification/Notification/components/icons'
import UserBadges from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './GiantTrackTile.module.css'

const { getUsers } = cacheUsersSelectors
const { beginTip } = tippingActions
const { getPremiumTrackStatusMap } = premiumContentSelectors
const { getAccountUser } = accountSelectors

const messages = {
  howToUnlock: 'HOW TO UNLOCK',
  unlocking: 'UNLOCKING',
  unlocked: 'UNLOCKED',
  collectibleGated: 'COLLECTIBLE GATED',
  specialAccess: 'SPECIAL ACCESS',
  goToCollection: 'Go To Collection',
  sendTip: 'Send Tip',
  followArtist: 'Follow Artist',
  period: '.',
  exclamationMark: '!',
  ownCollectibleGatedPrefix:
    'Users can unlock access by linking a wallet containing a collectible from ',
  unlockCollectibleGatedTrack:
    'To unlock this track, you must link a wallet containing a collectible from:',
  aCollectibleFrom: 'A Collectible from ',
  unlockingCollectibleGatedTrackSuffix: ' was found in a linked wallet.',
  unlockedCollectibleGatedTrackSuffix:
    ' was found in a linked wallet. This track is now available.',
  ownFollowGated: 'Users can unlock access by following your account!',
  unlockFollowGatedTrackPrefix: 'Follow',
  thankYouForFollowing: 'Thank you for following',
  unlockedFollowGatedTrackSuffix: '! This track is now available.',
  ownTipGated: 'Users can unlock access by sending you a tip!',
  unlockTipGatedTrackPrefix: 'Send',
  unlockTipGatedTrackSuffix: ' a tip.',
  thankYouForSupporting: 'Thank you for supporting',
  unlockingTipGatedTrackSuffix: ' by sending them a tip!',
  unlockedTipGatedTrackSuffix:
    ' by sending them a tip! This track is now available.'
}

type PremiumTrackAccessSectionProps = {
  trackId: ID
  premiumConditions: PremiumConditions
  followee: Nullable<User>
  tippedUser: Nullable<User>
  goToCollection: () => void
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
  className,
  buttonClassName
}: PremiumTrackAccessSectionProps) => {
  const dispatch = useDispatch()
  const [modalVisibility, setModalVisibility] = useModalState('LockedContent')
  const source = modalVisibility ? 'howToUnlockModal' : 'howToUnlockTrackPage'
  const followSource = modalVisibility
    ? FollowSource.HOW_TO_UNLOCK_MODAL
    : FollowSource.HOW_TO_UNLOCK_TRACK_PAGE
  const account = useSelector(getAccountUser)

  const handleSendTip = useCallback(() => {
    if (account) {
      dispatch(beginTip({ user: tippedUser, source, trackId }))
    } else {
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())
    }

    if (modalVisibility) {
      setModalVisibility(false)
    }
  }, [
    dispatch,
    account,
    tippedUser,
    source,
    trackId,
    modalVisibility,
    setModalVisibility
  ])

  const handleFollow = useCallback(() => {
    if (account) {
      if (premiumConditions.follow_user_id) {
        dispatch(
          socialActions.followUser(
            premiumConditions.follow_user_id,
            followSource,
            trackId
          )
        )
      }
    } else {
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())

      if (modalVisibility) {
        setModalVisibility(false)
      }
    }
  }, [
    dispatch,
    account,
    premiumConditions,
    followSource,
    trackId,
    modalVisibility,
    setModalVisibility
  ])

  const renderLockedDescription = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <div>{messages.unlockCollectibleGatedTrack}</div>
          <div
            className={styles.premiumContentSectionCollection}
            onClick={goToCollection}
          >
            {premiumConditions.nft_collection.imageUrl && (
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
            <span>{premiumConditions.nft_collection.name}</span>
          </div>
        </div>
      )
    }

    if (premiumConditions.follow_user_id) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <div>
            <span>{messages.unlockFollowGatedTrackPrefix}&nbsp;</span>
            <span>{followee?.name}</span>
            <UserBadges
              userId={premiumConditions.follow_user_id}
              className={styles.badgeIcon}
              badgeSize={14}
              useSVGTiers
            />
            <span>{messages.period}</span>
          </div>
        </div>
      )
    }

    if (premiumConditions.tip_user_id) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <div>
            <span>{messages.unlockTipGatedTrackPrefix}&nbsp;</span>
            <span>{tippedUser?.name}</span>
            <UserBadges
              userId={premiumConditions.tip_user_id}
              className={styles.badgeIcon}
              badgeSize={14}
              useSVGTiers
            />
            <span>{messages.unlockTipGatedTrackSuffix}</span>
          </div>
        </div>
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, followee, tippedUser, goToCollection])

  const renderButton = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return (
        <Button
          text={messages.goToCollection}
          onClick={goToCollection}
          rightIcon={<IconExternalLink />}
          type={ButtonType.PRIMARY_ALT}
          iconClassName={styles.buttonIcon}
          textClassName={styles.buttonText}
        />
      )
    }

    if (premiumConditions.follow_user_id) {
      return (
        <FollowButton
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

    if (premiumConditions.tip_user_id) {
      return (
        <Button
          text={messages.sendTip}
          onClick={handleSendTip}
          rightIcon={<IconTip />}
          type={ButtonType.PRIMARY_ALT}
          iconClassName={styles.buttonIcon}
          textClassName={styles.buttonText}
        />
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, goToCollection, handleFollow, handleSendTip])

  return (
    <div className={className}>
      <div>
        <div className={styles.premiumContentSectionTitle}>
          <IconLock className={styles.lockedIcon} />
          {messages.howToUnlock}
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
  className
}: PremiumTrackAccessSectionProps) => {
  const renderUnlockingDescription = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return (
        <div>
          <LoadingSpinner className={styles.spinner} />
          <span>{messages.aCollectibleFrom}</span>
          <span className={styles.collectibleName} onClick={goToCollection}>
            &nbsp;{premiumConditions.nft_collection.name}&nbsp;
          </span>
          <span>{messages.unlockingCollectibleGatedTrackSuffix}</span>
        </div>
      )
    }

    if (premiumConditions.follow_user_id) {
      return (
        <div>
          <LoadingSpinner className={styles.spinner} />
          <span>{messages.thankYouForFollowing}&nbsp;</span>
          <span>{followee?.name}</span>
          <UserBadges
            userId={premiumConditions.follow_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          <span>{messages.exclamationMark}</span>
        </div>
      )
    }

    if (premiumConditions.tip_user_id) {
      return (
        <div>
          <LoadingSpinner className={styles.spinner} />
          <span>{messages.thankYouForSupporting}&nbsp;</span>
          <span>{tippedUser?.name}</span>
          <UserBadges
            userId={premiumConditions.tip_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          <span>{messages.unlockingTipGatedTrackSuffix}</span>
        </div>
      )
    }
    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, followee, tippedUser, goToCollection])

  return (
    <div className={className}>
      <div>
        <div className={styles.premiumContentSectionTitle}>
          <IconLock className={styles.lockedIcon} />
          {messages.unlocking}
        </div>
        <div className={styles.premiumContentSectionDescription}>
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
  isOwner,
  className
}: PremiumTrackAccessSectionProps) => {
  const renderUnlockedDescription = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return isOwner ? (
        <div>
          <span>
            {messages.ownCollectibleGatedPrefix}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {premiumConditions.nft_collection.name}
            </span>
          </span>
        </div>
      ) : (
        <div>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          <span>
            {messages.aCollectibleFrom}
            <span className={styles.collectibleName} onClick={goToCollection}>
              {premiumConditions.nft_collection.name}
            </span>
            &nbsp;
          </span>
          <span>{messages.unlockedCollectibleGatedTrackSuffix}</span>
        </div>
      )
    }

    if (premiumConditions.follow_user_id) {
      return isOwner ? (
        <div>
          <span>{messages.ownFollowGated}</span>
        </div>
      ) : (
        <div>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          <span>{messages.thankYouForFollowing}&nbsp;</span>
          <span>{followee?.name}</span>
          <UserBadges
            userId={premiumConditions.follow_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          <span>{messages.unlockedFollowGatedTrackSuffix}</span>
        </div>
      )
    }

    if (premiumConditions.tip_user_id) {
      return isOwner ? (
        <div>
          <span>{messages.ownTipGated}</span>
        </div>
      ) : (
        <div>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          <span>{messages.thankYouForSupporting}&nbsp;</span>
          <span>{tippedUser?.name}</span>
          <UserBadges
            userId={premiumConditions.tip_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          <span>{messages.unlockedTipGatedTrackSuffix}</span>
        </div>
      )
    }

    console.warn(
      'No entity for premium conditions... should not have reached here.'
    )
    return null
  }, [premiumConditions, isOwner, followee, tippedUser, goToCollection])

  return (
    <div className={className}>
      <div className={styles.premiumContentSectionTitle}>
        {isOwner ? (
          premiumConditions.nft_collection ? (
            <IconCollectible className={styles.collectibleIcon} />
          ) : (
            <IconSpecialAccess className={styles.specialAccessIcon} />
          )
        ) : (
          <IconUnlocked className={styles.unlockedIcon} />
        )}
        {isOwner
          ? premiumConditions.nft_collection
            ? messages.collectibleGated
            : messages.specialAccess
          : messages.unlocked}
      </div>
      <div className={styles.premiumContentSectionDescription}>
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
}

export const PremiumTrackSection = ({
  isLoading,
  trackId,
  premiumConditions,
  doesUserHaveAccess,
  isOwner,
  wrapperClassName,
  className,
  buttonClassName
}: PremiumTrackSectionProps) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = premiumTrackStatusMap[trackId] ?? null
  const { follow_user_id: followUserId, tip_user_id: tipUserId } =
    premiumConditions ?? {}
  const users = useSelector<AppState, { [id: ID]: User }>((state) =>
    getUsers(state, {
      ids: [followUserId, tipUserId].filter(removeNullable)
    })
  )
  const followee = followUserId ? users[followUserId] : null
  const tippedUser = tipUserId ? users[tipUserId] : null
  const shouldDisplay =
    (premiumConditions ?? {}).nft_collection || followee || tippedUser

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  const handleGoToCollection = useCallback(() => {
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

  if (!isGatedContentEnabled) return null
  if (!premiumConditions) return null
  if (!shouldDisplay) return null

  if (doesUserHaveAccess) {
    return (
      <div
        className={cn(styles.premiumContentSection, fadeIn, wrapperClassName)}
      >
        <UnlockedPremiumTrackSection
          trackId={trackId}
          premiumConditions={premiumConditions}
          followee={followee}
          tippedUser={tippedUser}
          goToCollection={handleGoToCollection}
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
          premiumConditions={premiumConditions}
          followee={followee}
          tippedUser={tippedUser}
          goToCollection={handleGoToCollection}
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
        premiumConditions={premiumConditions}
        followee={followee}
        tippedUser={tippedUser}
        goToCollection={handleGoToCollection}
        isOwner={isOwner}
        className={cn(styles.premiumContentSectionLocked, className)}
        buttonClassName={buttonClassName}
      />
    </div>
  )
}
