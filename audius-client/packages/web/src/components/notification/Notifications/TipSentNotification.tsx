import React from 'react'

import { TipSent } from 'common/store/notifications/types'

import { AudioText } from './AudioText'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { ProfilePicture } from './ProfilePicture'
import styles from './TipSentNotification.module.css'
import { TwitterShareButton } from './TwitterShareButton'
import { UserNameLink } from './UserNameLink'
import { IconTip } from './icons'

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to'
}

type TipSentNotificationProps = {
  notification: TipSent
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props
  const { user, value, timeLabel, isRead } = notification

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture className={styles.profilePicture} user={user} />
        <span>
          {messages.sent} <AudioText value={value} /> {messages.to}{' '}
          <UserNameLink user={user} notification={notification} />
        </span>
      </NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
