import React from 'react'

import { RemixCosign } from 'common/store/notifications/types'

import TrackContent from '../components/TrackContent'

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
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of'
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
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
        <UserNameLink user={user} notification={notification} />
        {messages.cosign}
        <EntityLink entity={entity} entityType={entityType} />
      </NotificationBody>
      <div>
        <TrackContent notification={notification} goToEntityPage={() => {}} />
      </div>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
