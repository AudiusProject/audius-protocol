import React from 'react'

import NotificationBody from './NotificationBody'

export const NotificationType = Object.freeze({
  Follow: 'Follow',
  Repost: 'Repost',
  Favorite: 'Favorite',
  Milestone: 'Milestone',
  UserSubscription: 'UserSubscription',
  Announcement: 'Announcement'
})

const EntityType = Object.freeze({
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
})

const HighlightText = ({ text }) => (
  <span
    className={'avenir'}
    style={{
      color: '#7E1BCC',
      fontSize: '14px',
      fontWeight: '500'
    }}
  >
    {text}
  </span>
)

const BodyText = ({ text, className }) => (
  <span
    className={`avenir ${className}`}
    style={{
      color: '#858199',
      fontSize: '14px',
      fontWeight: '500'
    }}
  >
    {text}
  </span>
)

export const getUsers = (users) => {
  const [firstUser] = users
  if (users.length > 1) {
    return (
      <>
        <HighlightText text={firstUser.name} />
        <BodyText text={` and ${users.length - 1} other${users.length > 2 ? 's' : ''}`} />
      </>
    )
  }
  return <HighlightText text={firstUser.name} />
}

export const getEntity = (entity) => {
  if (entity.type === EntityType.Track) {
    return (
      <> <BodyText text={'track '} /><HighlightText text={entity.name} /> </>
    )
  } else if (entity.type === EntityType.Album) {
    return (
      <> <BodyText text={'album '} /><HighlightText text={entity.name} /> </>
    )
  } else if (entity.type === EntityType.Playlist) {
    return (
      <> <BodyText text={'playlist '} /><HighlightText text={entity.name} /> </>
    )
  }
}

const notificationMap = {
  [NotificationType.Favorite] (notification) {
    const user = getUsers(notification.users)
    const entity = getEntity(notification.entity)
    return (
      <span className={'notificationText'}>
        {user}<BodyText text={` favorited your `} />{entity}
      </span>
    )
  },
  [NotificationType.Repost] (notification) {
    const user = getUsers(notification.users)
    const entity = getEntity(notification.entity)
    return (
      <span className={'notificationText'}>
        {user}<BodyText text={` reposted your `} />{entity}
      </span>
    )
  },
  [NotificationType.Follow] (notification) {
    const user = getUsers(notification.users)
    return (
      <span className={'notificationText'}>
        {user}<BodyText text={` followed you`} />
      </span>
    )
  },
  [NotificationType.Announcement] (notification) {
    return <BodyText className={'notificationText'} text={notification.text} />
  },
  [NotificationType.Milestone] (notification) {
    if (notification.entity) {
      const entity = notification.entity.type.toLowerCase()
      return (
        <span className={'notificationText'}>
          <BodyText text={`Your ${entity} `} />
          <HighlightText text={notification.entity.name} />
          <BodyText text={` has reached over ${notification.value} ${notification.achievement}s`} />
        </span>
      )
    } else {
      return (
        <BodyText className={'notificationText'} text={`Your have reached over ${notification.value} Followers `} />
      )
    }
  },
  [NotificationType.UserSubscription] (notification) {
    const [user] = notification.users
    if (notification.entity.type === NotificationType.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
      return (
        <span className={'notificationText'}>
          <HighlightText text={user.name} />
          <BodyText text={` released ${notification.entity.count} new ${notification.entity.type}`} />
        </span>
      )
    }
    return (
      <span className={'notificationText'}>
        <HighlightText text={user.name} />
        <BodyText text={` released a new ${notification.entity.type}  ${notification.entity.name}`} />
      </span>
    )
  }
}

const getMessage = (notification) => {
  const getNotificationMessage = notificationMap[notification.type]
  if (!getNotificationMessage) return null
  return getNotificationMessage(notification)
}

const Notification = (props) => {
  const message = getMessage(props)
  return (
    <NotificationBody {...props} message={message} />
  )
}

export default Notification
