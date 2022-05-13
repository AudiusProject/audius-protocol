import React from 'react'

import { TipReaction } from 'common/store/notifications/types'

import { AudioText } from './AudioText'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { ProfilePicture } from './ProfilePicture'
import styles from './TipReactionNotification.module.css'
import { TwitterShareButton } from './TwitterShareButton'
import { UserNameLink } from './UserNameLink'
import { IconTip } from './icons'
import { reactions } from './reactions'

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of '
}

type TipReactionNotificationProps = {
  notification: TipReaction
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props
  const { user, reaction, value, timeLabel, isRead } = notification

  const userLinkElement = (
    <UserNameLink
      className={styles.profileLink}
      user={user}
      notification={notification}
    />
  )

  const Reaction = reactions[reaction]

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>
          {userLinkElement} {messages.reacted}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.reactionRoot}>
          <Reaction />
          <ProfilePicture
            className={styles.profilePicture}
            user={user}
            disablePopover
          />
        </div>
        <div className={styles.reactionTextRoot}>
          <div>
            {userLinkElement} {messages.react}
            <AudioText value={value} />
          </div>
        </div>
      </NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
