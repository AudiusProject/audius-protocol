import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { useUIAudio } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { TipSendNotification } from '@audius/common/store'

import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { env } from 'services/env'

import styles from './TipSentNotification.module.css'
import { AudioText } from './components/AudioText'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to',
  xShare: (senderHandle: string, uiAmount: number) =>
    `I just tipped ${senderHandle} ${uiAmount} $AUDIO on @audius`
}

type TipSentNotificationProps = {
  notification: TipSendNotification
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props
  const { amount, timeLabel, isViewed } = notification
  const uiAmount = useUIAudio(amount)

  const { data: user } = useUser(notification.entityId)
  const handleClick = useGoToProfile(user)

  const handleShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.xShare(senderHandle, uiAmount)
      return {
        shareText,
        analytics: make(Name.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE, {
          text: shareText
        })
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture className={styles.profilePicture} user={user} />
        <span>
          {messages.sent} <AudioText value={uiAmount} /> {messages.to}{' '}
          <UserNameLink user={user} notification={notification} />
        </span>
      </NotificationBody>
      <XShareButton
        type='dynamic'
        handle={user.handle}
        url={`${env.AUDIUS_URL}/${user.handle}`}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
