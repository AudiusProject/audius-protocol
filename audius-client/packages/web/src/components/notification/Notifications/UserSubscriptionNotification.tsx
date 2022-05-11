import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { Entity, UserSubscription } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'
import { profilePage } from 'utils/route'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { UserNameLink } from './UserNameLink'
import { IconRelease } from './icons'
import { getEntityLink } from './utils'

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
  const { user, entities, entityType, timeLabel, isRead, type } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const entitiesCount = entities.length

  const singleEntity = entitiesCount === 1

  const handleClick = useCallback(() => {
    if (entityType === Entity.Track && !singleEntity) {
      dispatch(push(profilePage(user.handle)))
    } else {
      const entityLink = getEntityLink(entities[0])
      dispatch(push(entityLink))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: entityLink })
      )
    }
  }, [entityType, singleEntity, user, entities, dispatch, record, type])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
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
