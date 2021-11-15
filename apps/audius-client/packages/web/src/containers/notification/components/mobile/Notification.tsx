import React, { useCallback } from 'react'

import { IconKebabHorizontal } from '@audius/stems'
import cn from 'classnames'

import { Name } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import IconButton from 'components/general/IconButton'
import {
  Entity,
  NotificationType,
  Achievement
} from 'containers/notification/store/types'
import { make, useRecord } from 'store/analytics/actions'
import { profilePage } from 'utils/route'

import TrackContent from '../TrackContent'
import { getEntityLink, TwitterShare } from '../TwitterShare'
import { formatHeader, formatBody } from '../formatText'

import UserHeader, { UserImage } from './ConnectedUserHeader'
import styles from './Notification.module.css'

// The number of users thumbnail images to show in the top row
// if there are multiple users associated w/ the notification
export const USER_LENGTH_LIMIT = 9

export type NotificationItemProps = {
  body?: React.ReactNode
  timeLabel: string
  onClickOverflow: (notificationId: string) => void
  notification: any
  goToRoute: (route: string) => void
  goToUserListPage: (NotificationId: string) => void
  markAsRead: (notificationId: string) => void
  setNotificationUsers: (userIds: ID[], limit: number) => void
  onClick?: () => void
}

const NotificationItem = (props: NotificationItemProps) => {
  const {
    goToRoute,
    markAsRead,
    notification,
    goToUserListPage,
    onClickOverflow
  } = props

  const {
    user,
    users,
    userIds,
    isRead,
    id,
    type,
    entity,
    entities
  } = notification
  const isMultiUser = !!users && users.length > 1
  const isSingleUser = !isMultiUser && (!!users || !!user)

  const record = useRecord()
  const markNotificationAsRead = useCallback(() => {
    markAsRead(id)
  }, [markAsRead, id])

  const onOpenUserListPage = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      goToUserListPage(id)
      markNotificationAsRead()
    },
    [id, goToUserListPage, markNotificationAsRead]
  )

  const goToEntityPage = (entity: any) => {
    const page = getEntityLink(entity)
    props.goToRoute(page)
    record(make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: page }))
  }
  const onProfileClick = useCallback(
    (handle: string) => {
      const profilePageRoute = profilePage(handle)
      goToRoute(profilePageRoute)
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: type,
          link_to: profilePageRoute
        })
      )
    },
    [record, type, goToRoute]
  )

  const header = formatHeader(
    props.notification,
    goToEntityPage,
    /* isMobile */ true
  )

  const body = formatBody(
    props.notification,
    onProfileClick,
    goToEntityPage,
    /* isMobile */ true,
    /* withOnClick */ true
  )

  const trackContent =
    notification.type === NotificationType.RemixCosign ? (
      <TrackContent
        notification={props.notification}
        goToEntityPage={goToEntityPage}
      />
    ) : null

  const onContainerClick = () => {
    markNotificationAsRead()
    switch (type) {
      case NotificationType.Favorite:
      case NotificationType.Repost: {
        goToEntityPage(entity)
        break
      }
      case NotificationType.Follow: {
        if (isMultiUser) onOpenUserListPage()
        else {
          const user = users[0]
          onProfileClick(user.handle)
        }
        break
      }
      case NotificationType.UserSubscription: {
        if (
          props.notification.entityType === Entity.Track &&
          entities.length > 1
        ) {
          props.goToRoute(profilePage(user.handle))
        } else {
          goToEntityPage(entities[0])
        }
        break
      }
      case NotificationType.Milestone: {
        if (props.notification.achievement === Achievement.Followers) {
          props.goToRoute(profilePage(user.handle))
        } else {
          goToEntityPage(entity)
        }
        break
      }
      case NotificationType.TrendingTrack: {
        goToEntityPage(entity)
        break
      }
      case NotificationType.RemixCreate:
      case NotificationType.RemixCosign: {
        const childTrack = notification.entities.find(
          (track: Track) => track.track_id === notification.childTrackId
        )
        goToEntityPage(childTrack)
        break
      }
    }
  }

  const onOptionsClick = useCallback(
    e => {
      e.stopPropagation()
      onClickOverflow(id)
      markNotificationAsRead()
    },
    [id, markNotificationAsRead, onClickOverflow]
  )

  const shouldShowUserImage =
    isSingleUser &&
    !(
      type === NotificationType.Milestone &&
      props.notification.achievement === Achievement.Followers
    ) &&
    !(type === NotificationType.TrendingTrack)
  return (
    <div
      className={cn(styles.container, { [styles.unRead]: !isRead })}
      onClick={onContainerClick}
    >
      <div className={styles.unReadDot}></div>
      {isMultiUser && (
        <UserHeader
          isRead={isRead}
          users={users!}
          userIds={userIds}
          goToUserListPage={onOpenUserListPage}
        />
      )}
      {header && (
        <div className={styles.headerContainer}>
          {header}
          <div className={styles.iconContainer}>
            <IconButton
              className={styles.menu}
              icon={<IconKebabHorizontal />}
              onClick={onOptionsClick}
            />
          </div>
        </div>
      )}

      <div className={styles.bodyContainer}>
        {shouldShowUserImage && (
          <div className={styles.singleUserImage}>
            <UserImage user={users ? users![0] : user!} />
          </div>
        )}
        <div className={styles.body}>{body}</div>
        {!header && (
          <div className={styles.iconContainer}>
            <IconButton
              className={styles.menu}
              icon={<IconKebabHorizontal />}
              onClick={onOptionsClick}
            />
          </div>
        )}
      </div>
      {trackContent}
      {(type === NotificationType.Milestone ||
        type === NotificationType.TrendingTrack ||
        type === NotificationType.RemixCosign ||
        type === NotificationType.RemixCreate) && (
        <TwitterShare
          notification={props.notification}
          markNotificationAsRead={markNotificationAsRead}
        />
      )}
      {props.body && <div>{props.body}</div>}
      <div className={styles.timeLabel}>{props.timeLabel}</div>
    </div>
  )
}

export default NotificationItem
