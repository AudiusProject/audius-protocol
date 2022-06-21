import { useCallback } from 'react'

import { useUIAudio } from 'audius-client/src/common/hooks/useUIAudio'
import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { TipSend } from 'audius-client/src/common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton,
  ProfilePicture
} from '../Notification'
import { TipText } from '../Notification/TipText'
import { UserNameLink } from '../Notification/UserNameLink'

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to'
}

type TipSentNotificationProps = {
  notification: TipSend
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props

  const { amount } = notification
  const uiAmount = useUIAudio(amount)

  const user = useSelectorWeb(
    state => getNotificationUser(state, notification),
    isEqual
  )

  const handleTwitterShare = useCallback(
    (senderHandle: string | undefined) => {
      const shareText = `I just tipped ${senderHandle} ${uiAmount} $AUDIO on @AudiusProject #Audius #AUDIOTip`
      return {
        shareText,
        analytics: make({
          eventName: EventNames.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE,
          text: shareText
        })
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <ProfilePicture profile={user} />
        <NotificationText style={{ flexShrink: 1 }}>
          {messages.sent} <TipText value={uiAmount} /> {messages.to}{' '}
          <UserNameLink user={user} />
        </NotificationText>
      </View>
      <NotificationTwitterButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
      />
    </NotificationTile>
  )
}
