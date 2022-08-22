import { useCallback } from 'react'

import type { TipSendNotification } from '@audius/common'
import { useUIAudio, notificationsSelectors } from '@audius/common'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

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

import { useGoToProfile } from './useGoToProfile'
const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to',
  twitterShare: (senderHandle: string, uiAmount: number) =>
    `I just tipped ${senderHandle} ${uiAmount} $AUDIO on @AudiusProject #Audius #AUDIOTip`
}

type TipSentNotificationProps = {
  notification: TipSendNotification
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props

  const { amount } = notification
  const uiAmount = useUIAudio(amount)

  const user = useSelectorWeb(
    (state) => getNotificationUser(state, notification),
    isEqual
  )

  const handlePress = useGoToProfile(user)

  const handleTwitterShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(senderHandle, uiAmount)
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
    <NotificationTile notification={notification} onPress={handlePress}>
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
