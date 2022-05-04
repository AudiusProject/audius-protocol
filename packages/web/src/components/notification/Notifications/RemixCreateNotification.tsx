import React from 'react'

import { RemixCreate } from 'common/store/notifications/types'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { TwitterShareButton } from './TwitterShareButton'
import { UserNameLink } from './UserNameLink'
import { IconRemix } from './icons'
import { TrackEntity } from './types'

const messages = {
  title: 'New remix of your track',
  by: 'by'
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { user, entities, entityType, timeLabel, isRead } = notification

  const entity = entities.find(
    track => track.track_id === notification.childTrackId
  ) as TrackEntity

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={entity} entityType={entityType} />
        <span>{messages.by}</span>
        <UserNameLink user={user} notification={notification} addMargin />
      </NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
