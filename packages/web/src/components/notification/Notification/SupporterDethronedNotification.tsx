import { useCallback } from 'react'

import {
  Nullable,
  cacheUsersSelectors,
  notificationsSelectors,
  SupporterDethronedNotification as SupporterDethroned
} from '@audius/common'
import { Name } from '@audius/common/models'

import crown from 'assets/img/crown2x.png'
import { useSelector } from 'common/hooks/useSelector'
import { make } from 'common/store/analytics/actions'

import styles from './SupporterDethronedNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { useGoToProfile } from './useGoToProfile'

const { getUser } = cacheUsersSelectors
const { getNotificationUser } = notificationsSelectors

type SupporterDethronedNotificationProps = {
  notification: SupporterDethroned
}

const messages = {
  title: "You've Been Dethroned!",
  body1: ' Dethroned You as ',
  body2: "'s #1 Top Supporter! Tip to Reclaim Your Spot?",
  twitterShare: (usurperHandle: string, supportingHandle: string) =>
    `I've been dethroned! ${usurperHandle} dethroned me as ${supportingHandle}'s #1 Top Supporter! #Audius $AUDIO #AUDIOTip`
}

const Crown = () => (
  <div className={styles.crown} style={{ backgroundImage: `url(${crown})` }} />
)

export const SupporterDethronedNotification = ({
  notification
}: SupporterDethronedNotificationProps) => {
  const { supportedUserId, timeLabel, isViewed } = notification
  const usurpingUser = useSelector((state) =>
    getNotificationUser(state, notification)
  )

  const supportedUser = useSelector((state) =>
    getUser(state, { id: supportedUserId })
  )

  const handleClick = useGoToProfile(supportedUser)

  const handleShare = useCallback(
    (usurpingHandle: string, supportingHandle?: Nullable<string>) => {
      // This shouldn't happen
      if (!supportingHandle) {
        return null
      }
      const shareText = messages.twitterShare(usurpingHandle, supportingHandle)
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
      <TwitterShareButton
        type='dynamic'
        handle={usurpingUser.handle}
        additionalHandle={supportedUser.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
