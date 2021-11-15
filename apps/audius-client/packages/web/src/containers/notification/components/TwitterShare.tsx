import React, { useCallback } from 'react'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'
import { Name } from 'common/models/Analytics'
import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import {
  Notification,
  NotificationType,
  Achievement,
  RemixCosign,
  RemixCreate,
  TrendingTrack,
  ChallengeReward,
  TierChange
} from 'containers/notification/store/types'
import { BadgeTier } from 'containers/user-badges/utils'
import AudiusBackend from 'services/AudiusBackend'
import { make, useRecord, TrackEvent } from 'store/analytics/actions'
import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullTrackPage,
  albumPage,
  playlistPage
} from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import styles from './TwitterShare.module.css'
import { getRankSuffix } from './formatText'

const messages = {
  shareText: 'Share to Twitter',
  shareTextFans: 'Share With Your Fans',
  shareTextMilestone: 'Share this Milestone'
} as const

const TWITTER_NOTIFICATION_TYPE = [
  NotificationType.ChallengeReward,
  NotificationType.Milestone,
  NotificationType.RemixCosign,
  NotificationType.RemixCreate,
  NotificationType.TierChange,
  NotificationType.TrendingTrack
] as const

const isTwitterNotificationType = (
  type: any
): type is TwitterNotificationType => TWITTER_NOTIFICATION_TYPE.includes(type)

type TwitterNotificationType = typeof TWITTER_NOTIFICATION_TYPE[number]

type TwitterPostInfo = {
  text: string
  link: string | null
}

export const getEntityLink = (
  entity: (Track & { user: User }) | (Collection & { user: User }),
  fullRoute = false
) => {
  if ('track_id' in entity) {
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

export const formatAchievementText = (
  type: string,
  name: string,
  value: number,
  achievement: string,
  link: string
) => {
  const achievementText =
    achievement === Achievement.Listens ? 'Plays' : achievement
  return `My ${type} ${name} has more than ${value} ${achievementText} on @AudiusProject #Audius
Check it out!`
}

const getAchievementText = async (notification: any) => {
  switch (notification.achievement) {
    case Achievement.Followers: {
      const link = fullProfilePage(notification.user.handle)
      const text = `I just hit over ${notification.value} followers on @AudiusProject #Audius!`
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

const getTrendingTrackText = async (notification: TrendingTrack) => {
  const link = getEntityLink(notification.entity, true)
  const text = `My track ${notification.entity.title} is trending ${
    notification.rank
  }${getRankSuffix(
    notification.rank
  )} on @AudiusProject! #AudiusTrending #Audius`
  return { link, text }
}

const getTwitterHandleByUserHandle = async (userHandle: string) => {
  const { twitterHandle } = await AudiusBackend.getCreatorSocialHandle(
    userHandle
  )
  return twitterHandle || ''
}

const getRemixCreateText = async (notification: RemixCreate) => {
  const track = notification.entities.find(
    t => t.track_id === notification.parentTrackId
  )
  if (!track) return null
  const link = getEntityLink(track, true)

  let twitterHandle = await getTwitterHandleByUserHandle(
    notification.user.handle
  )
  if (!twitterHandle) twitterHandle = notification.user.name
  else twitterHandle = `@${twitterHandle}`

  return {
    text: `New remix of ${track.title} by ${twitterHandle} on @AudiusProject #Audius`,
    link
  }
}

const getRemixCosignText = async (
  notification: RemixCosign & {
    user: User
    entities: (Track & { user: User })[]
  }
) => {
  const parentTrack = notification.entities.find(
    (t: Track) => t.owner_id === notification.parentTrackUserId
  )
  const childtrack = notification.entities.find(
    (t: Track) => t.track_id === notification.childTrackId
  )

  if (!parentTrack || !childtrack) return { text: '', link: '' }

  let twitterHandle = await getTwitterHandleByUserHandle(
    notification.user.handle
  )
  if (!twitterHandle) twitterHandle = notification.user.name
  else twitterHandle = `@${twitterHandle}`

  const link = getEntityLink(childtrack, true)

  return {
    text: `My remix of ${parentTrack.title} was Co-Signed by ${twitterHandle} on @AudiusProject #Audius`,
    link
  }
}

const getRewardsText = async (notification: ChallengeReward) => ({
  text: `I earned $AUDIO for completing challenges on @AudiusProject #AudioRewards`,
  link: null
})

const tierInfoMap: Record<BadgeTier, { label: string; icon: string }> = {
  none: { label: 'None', icon: '' },
  bronze: { label: 'Bronze', icon: '🥉' },
  silver: { label: 'Silver', icon: '🥈' },
  gold: { label: 'Gold', icon: '🥇' },
  platinum: { label: 'Platinum', icon: '🥇' }
}

export const getTierChangeText = async (
  notification: TierChange & { user: User }
) => {
  const { label, icon } = tierInfoMap[notification.tier]
  return {
    link: fullProfilePage(notification.user.handle),
    text: `I’ve reached ${label} Tier on @AudiusProject! Check out the shiny new badge next to my name ${icon}`
  }
}

const twitterPostInfoMap: Record<
  TwitterNotificationType,
  (notification: any) => Promise<TwitterPostInfo | null>
> = {
  [NotificationType.Milestone]: getAchievementText,
  [NotificationType.RemixCreate]: getRemixCreateText,
  [NotificationType.RemixCosign]: getRemixCosignText,
  [NotificationType.TrendingTrack]: getTrendingTrackText,
  [NotificationType.ChallengeReward]: getRewardsText,
  [NotificationType.TierChange]: getTierChangeText
} as const

const twitterButtonTextMap: Record<TwitterNotificationType, string> = {
  [NotificationType.Milestone]: messages.shareTextMilestone,
  [NotificationType.TrendingTrack]: messages.shareTextMilestone,
  [NotificationType.RemixCreate]: messages.shareTextFans,
  [NotificationType.RemixCosign]: messages.shareTextFans,
  [NotificationType.ChallengeReward]: messages.shareTextFans,
  [NotificationType.TierChange]: messages.shareText
}

const recordTwitterShareEvent = (
  type: TwitterNotificationType,
  record: (event: TrackEvent) => void,
  text: string
) => {
  switch (type) {
    case NotificationType.Milestone:
      return record(
        make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
          milestone: text
        })
      )
    case NotificationType.TrendingTrack:
      return record(
        make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
          milestone: text
        })
      )
    case NotificationType.RemixCreate:
      return record(
        make(Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE, {
          text
        })
      )
    case NotificationType.RemixCosign:
      return record(
        make(Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE, {
          text
        })
      )
  }
}

export const TwitterShare = ({
  notification,
  markNotificationAsRead
}: {
  notification: Notification
  markNotificationAsRead: () => void
}) => {
  const { type } = notification

  const record = useRecord()
  const onClick = useCallback(
    async e => {
      e.stopPropagation()
      markNotificationAsRead()

      if (isTwitterNotificationType(type)) {
        const twitterPostInfo = await twitterPostInfoMap[type](notification)
        if (!twitterPostInfo) return
        openTwitterLink(twitterPostInfo.link, twitterPostInfo.text)
        recordTwitterShareEvent(type, record, twitterPostInfo.text)
      }
    },
    [record, type, notification, markNotificationAsRead]
  )

  if (!isTwitterNotificationType(type)) return null

  const twitterText = twitterButtonTextMap[type]
  return (
    <div onClick={onClick} className={styles.twitterContainer}>
      <IconTwitterBird className={styles.iconTwitterBird} />
      {twitterText}
    </div>
  )
}
