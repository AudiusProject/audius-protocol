import React from 'react'

import { TipReaction } from 'common/store/notifications/types'

import styles from './TipReactionNotification.module.css'
import { AudioText } from './components/AudioText'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { reactions } from './components/Reaction'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'

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
  const { user, reaction, value, timeLabel, isViewed } = notification

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
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
