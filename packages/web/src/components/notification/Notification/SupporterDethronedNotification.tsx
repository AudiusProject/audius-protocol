import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { Name } from '@audius/common/models'
import { SupporterDethronedNotification as SupporterDethroned } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'

import crown from 'assets/img/crown2x.png'
import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'

import styles from './SupporterDethronedNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { useGoToProfile } from './useGoToProfile'

type SupporterDethronedNotificationProps = {
  notification: SupporterDethroned
}

const messages = {
  title: "You've Been Dethroned!",
  body1: ' Dethroned You as ',
  body2: "'s #1 Top Supporter! Tip to Reclaim Your Spot?",
  xShare: (usurperHandle: string, supportingHandle: string) =>
    `I've been dethroned! ${usurperHandle} dethroned me as ${supportingHandle}'s #1 Top Supporter! $AUDIO`
}

const Crown = () => (
  <div className={styles.crown} style={{ backgroundImage: `url(${crown})` }} />
)

export const SupporterDethronedNotification = ({
  notification
}: SupporterDethronedNotificationProps) => {
  const { supportedUserId, timeLabel, isViewed } = notification
  const { data: usurpingUser } = useUser(notification.entityId)

  const { data: supportedUser } = useUser(supportedUserId)

  const handleClick = useGoToProfile(supportedUser)

  const handleShare = useCallback(
    (usurpingHandle: string, supportingHandle?: Nullable<string>) => {
      // This shouldn't happen
      if (!supportingHandle) {
        return null
      }
      const shareText = messages.xShare(usurpingHandle, supportingHandle)
      return {
        shareText,
        analytics: make(Name.NOTIFICATIONS_CLICK_DETHRONED_TWITTER_SHARE, {
          text: shareText
        })
      }
    },
    []
  )

  if (!usurpingUser || !supportedUser) {
    return null
  }

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<Crown />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          user={supportedUser}
          className={styles.profilePicture}
        />
        <span>
          <UserNameLink user={usurpingUser} notification={notification} />
          {messages.body1}
          <UserNameLink user={supportedUser} notification={notification} />
          {messages.body2}
        </span>
      </NotificationBody>
      <XShareButton
        type='dynamic'
        handle={usurpingUser.handle}
        additionalHandle={supportedUser.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
