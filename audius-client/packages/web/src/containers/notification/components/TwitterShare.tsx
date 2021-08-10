import React, { useCallback } from 'react'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'
import {
  Notification,
  NotificationType,
  Achievement,
  RemixCosign,
  RemixCreate,
  TrendingTrack
} from 'containers/notification/store/types'
import Collection from 'models/Collection'
import Track from 'models/Track'
import User from 'models/User'
import AudiusBackend from 'services/AudiusBackend'
import { Name } from 'services/analytics'
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

const getAchievementText = (notification: any) => {
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

const getTrendingTrackText = (notification: TrendingTrack) => {
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

export const getRemixCreateText = async (notification: RemixCreate) => {
  const track = notification.entities.find(
    t => t.track_id === notification.parentTrackId
  )
  if (!track) return
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

export const getRemixCosignText = async (
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
export const getNotificationTwitterText = async (notification: any) => {
  if (notification.type === NotificationType.Milestone) {
    return getAchievementText(notification)
  } else if (notification.type === NotificationType.TrendingTrack) {
    return getTrendingTrackText(notification)
  } else if (notification.type === NotificationType.RemixCreate) {
    return getRemixCreateText(notification)
  } else if (notification.type === NotificationType.RemixCosign) {
    return getRemixCosignText(notification)
  }
}

export const getTwitterButtonText = (notification: any) => {
  switch (notification.type) {
    case NotificationType.TrendingTrack:
    case NotificationType.Milestone:
      return 'Share this Milestone'
    case NotificationType.RemixCreate:
    case NotificationType.RemixCosign:
      return 'Share With Your Fans'
    default:
      return ''
  }
}

const recordTwitterShareEvent = (
  type: NotificationType,
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
  const record = useRecord()
  const onClick = useCallback(
    async e => {
      e.stopPropagation()
      markNotificationAsRead()
      const twitterText = await getNotificationTwitterText(notification)
      if (!twitterText) return
      openTwitterLink(twitterText.link, twitterText.text)
      recordTwitterShareEvent(notification.type, record, twitterText.text)
    },
    [record, notification, markNotificationAsRead]
  )
  if (
    notification.type !== NotificationType.Milestone &&
    notification.type !== NotificationType.TrendingTrack &&
    notification.type !== NotificationType.RemixCosign &&
    notification.type !== NotificationType.RemixCreate
  )
    return null
  const twitterText = getTwitterButtonText(notification)
  return (
    <div onClick={onClick} className={styles.twitterContainer}>
      <IconTwitterBird className={styles.iconTwitterBird} />
      {twitterText}
    </div>
  )
}
