import React from 'react'

import { UserSubscription } from 'common/store/notifications/types'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { UserNameLink } from './UserNameLink'
import { IconRelease } from './icons'

const messages = {
  title: 'New Release',
  posted: 'posted',
  new: 'new'
}

type UserSubscriptionNotificationProps = {
  notification: UserSubscription
}

export const UserSubscriptionNotification = (
  props: UserSubscriptionNotificationProps
) => {
  const { notification } = props
  const { user, entities, entityType, timeLabel, isRead } = notification

  const entitiesCount = entities.length

  const singleEntity = entitiesCount === 1

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconRelease />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={user} notification={notification} />
        {messages.posted} {singleEntity ? 'a' : entitiesCount} {messages.new}{' '}
        {entityType.toLowerCase()}
        {singleEntity ? '' : 's'}
        {singleEntity ? (
          <EntityLink entity={entities[0]} entityType={entityType} />
        ) : null}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
