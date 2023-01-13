import { useCallback, useEffect, useMemo, useState } from 'react'

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
  tippingSelectors,
  tippingActions
} from '@audius/common'
import { Button, ButtonType, IconLock, IconUnlocked } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconExternalLink } from 'assets/img/iconExternalLink.svg'
import { ReactComponent as IconVerifiedGreen } from 'assets/img/iconVerifiedGreen.svg'
import FollowButton from 'components/follow-button/FollowButton'
import { IconTip } from 'components/notification/Notification/components/icons'
import UserBadges from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import { usePrevious } from 'react-use'

import styles from './GiantTrackTile.module.css'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

const { getUsers } = cacheUsersSelectors
const { getSendStatus } = tippingSelectors
const { beginTip } = tippingActions

const messages = {
  howToUnlock: 'HOW TO UNLOCK',
  unlockCollectibleGatedTrack:
    'To unlock this track, you must link a wallet containing a collectible from:',
  unlockedCollectibleGatedTrackPrefix: 'A Collectible from ',
  unlockedCollectibleGatedTrackSuffix:
    ' was found in a linked wallet. This track is now available.',
  goToCollection: 'Go To Collection',
  sendTip: 'Send Tip',
  followArtist: 'Follow Artist',
  unlockFollowGatedTrackPrefix: 'Follow ',
  unlockedFollowGatedTrackPrefix: 'Thank you for following ',
  unlockTipGatedTrackPrefix: 'Send ',
  unlockTipGatedTrackSuffix: ' a tip',
  unlockedTipGatedTrackPrefix: 'Thank you for tipping ',
  unlockedSpecialAccessGatedTrackSuffix: '! This track is now available.',
  unlocked: 'UNLOCKED',
  unlocking: 'Unlocking'
}

type PremiumTrackAccessSectionProps = {
  premiumConditions: PremiumConditions
  followee: Nullable<User>
  tippedUser: Nullable<User>
}

const LockedPremiumTrackSection = ({
  premiumConditions,
  followee,
  tippedUser
}: PremiumTrackAccessSectionProps) => {
  const dispatch = useDispatch()
  const sendStatus = useSelector(getSendStatus)
  const previousSendStatus = usePrevious(sendStatus)
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Set unlocking state if send tip is successful and user closed the tip modal.
  useEffect(() => {
    if (previousSendStatus === 'SUCCESS' && sendStatus === null) {
      setIsUnlocking(true)
      // Poll discovery to get user's premium content signature for this track.
      // dispatch(refreshPremiumTrack())
    }
  }, [previousSendStatus, sendStatus])

  const handleSendTip = useCallback(() => {
    dispatch(beginTip({ user: tippedUser, source: 'trackPage' }))
  }, [dispatch, tippedUser])

  const handleFollow = useCallback(() => {
    if (premiumConditions.follow_user_id) {
      dispatch(
        socialActions.followUser(
          premiumConditions.follow_user_id,
          FollowSource.TRACK_PAGE
        )
      )
      // Set unlocking state if user has clicked on button to follow artist.
      setIsUnlocking(true)
      // Poll discovery to get user's premium content signature for this track.
      // dispatch(refreshPremiumTrack())
    }
  }, [dispatch, premiumConditions])

  const handleGoToCollection = useCallback(() => {
    const { chain, address, externalLink } =
      premiumConditions.nft_collection ?? {}
    if (chain === Chain.Eth && 'slug' in premiumConditions.nft_collection!) {
      const url = `https://opensea.io/collection/${premiumConditions.nft_collection.slug}`
      window.open(url, '_blank')
    } else if (chain === Chain.Sol) {
      const explorerUrl = `https://explorer.solana.com/address/${address}`
      const url = externalLink ? new URL(externalLink).hostname : explorerUrl
      window.open(url, '_blank')
    }
  }, [premiumConditions])

  const renderLockedDescription = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <p>{messages.unlockCollectibleGatedTrack}</p>
          <div className={styles.premiumContentSectionCollection}>
            {premiumConditions.nft_collection.imageUrl && (
              <img
                src={premiumConditions.nft_collection.imageUrl}
                alt={`${premiumConditions.nft_collection.name} nft collection`}
              />
            )}
            {premiumConditions.nft_collection.name}
          </div>
        </div>
      )
    }

    if (premiumConditions.follow_user_id) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <p>
            {messages.unlockFollowGatedTrackPrefix}
            {followee?.name}
            <UserBadges
              userId={premiumConditions.follow_user_id}
              className={styles.badgeIcon}
              badgeSize={14}
              useSVGTiers
            />
          </p>
        </div>
      )
    }

    if (premiumConditions.tip_user_id) {
      return (
        <div className={styles.premiumContentSectionDescription}>
          <p>
            {messages.unlockTipGatedTrackPrefix}
            {tippedUser?.name}
            <UserBadges
              userId={premiumConditions.tip_user_id}
              className={styles.badgeIcon}
              badgeSize={14}
              useSVGTiers
            />
            {messages.unlockTipGatedTrackSuffix}
          </p>
        </div>
      )
    }

    // should not reach here
    return null
  }, [premiumConditions, followee, tippedUser])

  const renderButton = useCallback(() => {
    if (isUnlocking) {
      return (
        <Button
          text={messages.unlocking}
          rightIcon={<LoadingSpinner className={styles.spinner} />}
          type={ButtonType.PRIMARY_ALT}
          iconClassName={styles.buttonIcon}
          textClassName={styles.buttonText}
          disabled
        />
      )
    }

    if (premiumConditions.nft_collection) {
      return (
        <Button
          text={messages.goToCollection}
          onClick={handleGoToCollection}
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

    // should not reach here
    return null
  }, [premiumConditions, handleGoToCollection, handleFollow, handleSendTip, isUnlocking])

  return (
    <div className={styles.premiumContentSectionLocked}>
      <div>
        <div className={styles.premiumContentSectionTitle}>
          <IconLock className={styles.lockedIcon} />
          {messages.howToUnlock}
        </div>
        {renderLockedDescription()}
      </div>
      <div className={styles.premiumContentSectionButton}>{renderButton()}</div>
    </div>
  )
}

const UnlockedPremiumTrackSection = ({
  premiumConditions,
  followee,
  tippedUser
}: PremiumTrackAccessSectionProps) => {
  const renderUnlockedDescription = useCallback(() => {
    if (premiumConditions.nft_collection) {
      return (
        <p>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          {messages.unlockedCollectibleGatedTrackPrefix}
          <span className={styles.collectibleName}>
            &nbsp;{premiumConditions.nft_collection.name}&nbsp;
          </span>
          {messages.unlockedCollectibleGatedTrackSuffix}
        </p>
      )
    }

    if (premiumConditions.follow_user_id) {
      return (
        <p>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          {messages.unlockedFollowGatedTrackPrefix}
          {followee?.name}
          <UserBadges
            userId={premiumConditions.follow_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          {messages.unlockedSpecialAccessGatedTrackSuffix}
        </p>
      )
    }

    if (premiumConditions.tip_user_id) {
      return (
        <p>
          <IconVerifiedGreen className={styles.verifiedGreenIcon} />
          {messages.unlockedTipGatedTrackPrefix}
          {tippedUser?.name}
          <UserBadges
            userId={premiumConditions.tip_user_id}
            className={styles.badgeIcon}
            badgeSize={14}
            useSVGTiers
          />
          {messages.unlockedSpecialAccessGatedTrackSuffix}
        </p>
      )
    }

    // should not reach here
    return null
  }, [premiumConditions, followee, tippedUser])

  return (
    <div className={styles.premiumContentSectionUnlocked}>
      <div className={styles.premiumContentSectionTitle}>
        <IconUnlocked className={styles.unlockedIcon} />
        {messages.unlocked}
      </div>
      <div className={styles.premiumContentSectionDescription}>
        {renderUnlockedDescription()}
      </div>
    </div>
  )
}

type PremiumTrackSectionProps = {
  isLoading: boolean
  premiumConditions: PremiumConditions
  doesUserHaveAccess: boolean
}

export const PremiumTrackSection = ({
  isLoading,
  premiumConditions,
  doesUserHaveAccess
}: PremiumTrackSectionProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )
  const { follow_user_id: followUserId, tip_user_id: tipUserId } =
    premiumConditions ?? {}
  const users = useSelector<AppState, { [id: ID]: User }>((state) =>
    getUsers(state, {
      ids: [followUserId, tipUserId].filter((id): id is number => !!id)
    })
  )
  const followee = useMemo(
    () => (followUserId ? users[followUserId] : null),
    [users, followUserId]
  )
  const tippedUser = useMemo(
    () => (tipUserId ? users[tipUserId] : null),
    [users, tipUserId]
  )
  const shouldDisplay =
    (premiumConditions ?? {}).nft_collection || followee || tippedUser

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  if (!isPremiumContentEnabled) return null
  if (!premiumConditions) return null
  if (!shouldDisplay) return null

  return (
    <div className={cn(styles.premiumContentSection, fadeIn)}>
      {doesUserHaveAccess ? (
        <UnlockedPremiumTrackSection
          premiumConditions={premiumConditions}
          followee={followee}
          tippedUser={tippedUser}
        />
      ) : (
        <LockedPremiumTrackSection
          premiumConditions={premiumConditions}
          followee={followee}
          tippedUser={tippedUser}
        />
      )}
    </div>
  )
}
