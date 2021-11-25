import React, { useCallback } from 'react'

import cn from 'classnames'

import { formatCount } from 'common/utils/formatUtil'
import ArtistPopover from 'components/artist/ArtistPopover'
import { challengeRewardsConfig } from 'containers/audio-rewards-page/config'
import {
  Notification,
  NotificationType,
  Achievement
} from 'containers/notification/store/types'
import UserBadges, { audioTierMapPng } from 'containers/user-badges/UserBadges'
import { badgeTiers } from 'containers/user-badges/utils'
import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullTrackPage,
  albumPage,
  playlistPage
} from 'utils/route'

import styles from './FormatText.module.css'

const getEntityName = (entity: any) => entity.title || entity.playlist_name
export const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

const formatAchievementText = (
  type: string,
  name: string,
  value: number,
  achievement: string,
  link: string
) => {
  const achievementText =
    achievement === Achievement.Listens ? 'Plays' : achievement
  return `My ${type} ${name} has more than ${value} ${achievementText} on #Audius
Check it out!`
}

export const getAchievementText = (notification: any) => {
  switch (notification.achievement) {
    case Achievement.Followers: {
      const link = fullProfilePage(notification.user.handle)
      const text = `I just hit over ${notification.value} followers on #Audius!`
      return { text, link }
    }
    case Achievement.Favorites:
    case Achievement.Listens:
    case Achievement.Reposts: {
      const link = getEntityLink(notification.entity, true)
      const text = formatAchievementText(
        notification.entityType,
        notification.entity.title || notification.entity.playlist_name,
        notification.value,
        notification.achievement,
        link
      )
      return { text, link }
    }
    default: {
      return { text: '', link: '' }
    }
  }
}

const getEntityLink = (entity: any, fullRoute = false) => {
  if (entity.track_id) {
    return fullRoute ? fullTrackPage(entity.permalink) : entity.permalink
  } else if (entity.playlist_id && entity.is_album) {
    const getRoute = fullRoute ? fullAlbumPage : albumPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
    )
  }
  const getRoute = fullRoute ? fullPlaylistPage : playlistPage
  return getRoute(entity.user.handle, entity.playlist_name, entity.playlist_id)
}

const UserName = ({
  userId,
  name,
  handle,
  onProfileClick,
  withOnClick,
  isMobile = false,
  isDeactivated = false
}: {
  userId: number
  name: string
  handle: string
  onProfileClick: (handle: string) => void
  withOnClick: boolean
  isMobile: boolean
  isDeactivated?: boolean
}) => {
  const onClick = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      onProfileClick(handle)
    },
    [onProfileClick, handle]
  )
  if (withOnClick) {
    return isDeactivated ? (
      <div className={cn(styles.userName, styles.userNameDeactivated)}>
        {name} [Deactivated]
      </div>
    ) : (
      <span className={styles.headerLink}>
        {isMobile ? (
          <div className={styles.userName}>
            <a onClick={onClick} href={`/${handle}`}>
              {name}
            </a>
            <UserBadges
              userId={userId}
              badgeSize={12}
              className={styles.badges}
            />
          </div>
        ) : (
          <ArtistPopover handle={handle}>
            <div className={styles.userName}>
              <a onClick={onClick} href={`/${handle}`}>
                {name}
              </a>
              <UserBadges
                userId={userId}
                badgeSize={12}
                className={styles.badges}
              />
            </div>
          </ArtistPopover>
        )}
      </span>
    )
  }
  return (
    <span className={styles.headerLink}>
      <div className={styles.userNameWrapper}>
        <div className={styles.userName}>
          <span>{name}</span>
          <UserBadges
            userId={userId}
            badgeSize={12}
            className={styles.badges}
          />
        </div>
      </div>
    </span>
  )
}

export const formatBody = (
  notification: Notification,
  onProfileClick: (handle: string) => void,
  goToEntityPage: (entity: any) => void,
  isMobile = false,
  withOnClick = true
) => {
  const getEntityClick = (entity: any) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (withOnClick) goToEntityPage(entity)
  }
  switch (notification.type) {
    case NotificationType.Follow: {
      const firstUser = (notification as any).users[0]
      let otherUsers = ''
      if ((notification as any).userIds.length > 1) {
        const usersLen = (notification as any).userIds.length - 1
        otherUsers = ` and ${formatCount(usersLen)} other${
          usersLen > 1 ? 's' : ''
        }`
      }
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <UserName
            isDeactivated={firstUser.is_deactivated}
            userId={firstUser.user_id}
            name={firstUser.name}
            handle={firstUser.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
          {`${otherUsers} followed you`}
        </span>
      )
    }
    case NotificationType.UserSubscription: {
      const user = (notification as any).user
      const isMultipleUploads = (notification as any).entities.length > 1
      if (isMultipleUploads) {
        return (
          <span
            className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
          >
            <UserName
              isDeactivated={user.is_deactivated}
              userId={user.user_id}
              name={user.name}
              handle={user.handle}
              onProfileClick={onProfileClick}
              withOnClick={withOnClick}
              isMobile={isMobile}
            />
            {` posted ${
              (notification as any).entities.length
            } new ${notification.entityType.toLowerCase()}s `}
          </span>
        )
      }
      const entity = (notification as any).entities[0]
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <UserName
            isDeactivated={user.is_deactivated}
            userId={user.user_id}
            name={user.name}
            handle={user.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
          {` posted a new ${notification.entityType.toLowerCase()} `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
        </span>
      )
    }
    case NotificationType.Repost: {
      const firstUser = (notification as any).users[0]
      let otherUsers = ''
      if ((notification as any).userIds.length > 1) {
        const usersLen = (notification as any).userIds.length - 1
        otherUsers = ` and ${formatCount(usersLen)} other${
          usersLen > 1 ? 's' : ''
        }`
      }
      const entityType = notification.entityType
      const entity = (notification as any).entity
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <UserName
            isDeactivated={firstUser.is_deactivated}
            userId={firstUser.user_id}
            name={firstUser.name}
            handle={firstUser.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
          {`${otherUsers} reposted your ${entityType.toLowerCase()} `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
        </span>
      )
    }
    case NotificationType.Favorite: {
      const firstUser = (notification as any).users[0]
      let otherUsers = ''
      if ((notification as any).userIds.length > 1) {
        const usersLen = (notification as any).userIds.length - 1
        otherUsers = ` and ${formatCount(usersLen)} other${
          usersLen > 1 ? 's' : ''
        }`
      }
      const entityType = notification.entityType
      const entity = (notification as any).entity

      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <UserName
            isDeactivated={firstUser.is_deactivated}
            userId={firstUser.user_id}
            name={firstUser.name}
            handle={firstUser.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
          {`${otherUsers} favorited your ${entityType.toLowerCase()} `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
        </span>
      )
    }
    case NotificationType.Milestone: {
      if (notification.achievement === Achievement.Followers) {
        return (
          <span
            className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
          >
            {`You have reached over ${formatCount(notification.value)} ${
              notification.achievement
            }`}
          </span>
        )
      } else {
        const entity = notification.entity
        const achievementText =
          notification.achievement === Achievement.Listens
            ? 'Plays'
            : notification.achievement
        return (
          <span
            className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
          >
            {`Your ${notification.entityType.toLowerCase()} `}
            <span
              onClick={getEntityClick(entity)}
              className={styles.headerLink}
            >
              {getEntityName(entity)}
            </span>
            {` has reached over ${formatCount(
              notification.value
            )} ${achievementText}`}
          </span>
        )
      }
    }
    case NotificationType.TrendingTrack: {
      const { entity, rank } = notification
      const rankSuffix = getRankSuffix(rank)
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          {`Your Track `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
          {` is ${rank}${rankSuffix} on Trending Right Now! `}
          <i className='emoji bottle-with-popping-cork' />
        </span>
      )
    }
    case NotificationType.RemixCreate: {
      const user = notification.user
      const entity = notification.entities.find(
        track => track.track_id === notification.childTrackId
      )
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
          {` by `}
          <UserName
            userId={user.user_id}
            name={user.name}
            handle={user.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
        </span>
      )
    }
    case NotificationType.RemixCosign: {
      const user = notification.user
      const entity = notification.entities.find(
        track => track.owner_id === notification.parentTrackUserId
      )

      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <UserName
            isDeactivated={user.is_deactivated}
            userId={user.user_id}
            name={user.name}
            handle={user.handle}
            onProfileClick={onProfileClick}
            withOnClick={withOnClick}
            isMobile={isMobile}
          />
          {` Co-signed your Remix of `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
        </span>
      )
    }
    case NotificationType.ChallengeReward: {
      const { amount: rewardAmount, title, icon } = challengeRewardsConfig[
        notification.challengeId
      ]
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <span
            className={cn(styles.rewardTitle, { [styles.isMobile]: isMobile })}
          >
            {icon}
            {title}
          </span>
          {`You’ve earned ${rewardAmount} $AUDIO for completing this challenge!`}
        </span>
      )
    }
    case NotificationType.TierChange: {
      const tierInfo = badgeTiers.find(info => info.tier === notification.tier)
      if (!tierInfo) return null
      const { tier, humanReadableAmount } = tierInfo

      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          <span
            className={cn(styles.tierTitle, { [styles.isMobile]: isMobile })}
          >
            {audioTierMapPng[tier]}
            {`${tier.toUpperCase()} TIER UNLOCKED`}
          </span>
          {`Congrats, you’ve reached ${tier} Tier by having over ${humanReadableAmount} $AUDIO! You now have access to exclusive features & a shiny new badge by your name.`}
        </span>
      )
    }
  }
}

export const formatHeader = (
  notification: Notification,
  goToEntityPage: (entity: any) => void,
  isMobile = false,
  withOnClick = true
) => {
  const getEntityClick = (entity: any) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (withOnClick) {
      e.stopPropagation()
      goToEntityPage(entity)
    }
  }
  switch (notification.type) {
    case NotificationType.RemixCreate: {
      const entity = notification.entities.find(
        track => track.track_id === notification.parentTrackId
      )
      return (
        <span
          className={cn(styles.headerText, { [styles.isMobile]: isMobile })}
        >
          {`New remix of your track `}
          <span onClick={getEntityClick(entity)} className={styles.headerLink}>
            {getEntityName(entity)}
          </span>
        </span>
      )
    }
  }
  return null
}
export default formatBody
