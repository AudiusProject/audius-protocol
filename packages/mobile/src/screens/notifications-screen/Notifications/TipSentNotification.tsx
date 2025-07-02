import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { useUIAudio } from '@audius/common/hooks'
import type { TipSendNotification } from '@audius/common/store'
import { Platform, View } from 'react-native'

import { IconTipping } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationXButton,
  NotificationProfilePicture
} from '../Notification'
import { TipText } from '../Notification/TipText'
import { UserNameLink } from '../Notification/UserNameLink'

const messages = {
  title: 'Your Tip Was Sent!',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: 'Your $AUDIO Was Sent!', // iOS only
  sent: 'You successfully sent a tip of',
  sentAlt: 'You successfully sent', // iOS only
  to: 'to',
  // NOTE: Send tip -> Send $AUDIO changes
  xShare: (senderHandle: string, uiAmount: number, ios: boolean) =>
    `I just ${
      ios ? 'tipped' : 'sent'
    } ${senderHandle} ${uiAmount} $AUDIO on @audius ${ios ? '' : ''}`
}

type TipSentNotificationProps = {
  notification: TipSendNotification
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props

  const { amount } = notification
  const uiAmount = useUIAudio(amount)
  const navigation = useNotificationNavigation()

  const { data: user } = useUser(notification.entityId)

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleXShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.xShare(
        senderHandle,
        uiAmount,
        Platform.OS === 'ios'
      )
      return {
        shareText,
        analytics: {
          eventName: EventNames.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTipping}>
        <NotificationTitle>
          {Platform.OS === 'ios' ? messages.titleAlt : messages.title}
        </NotificationTitle>
      </NotificationHeader>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <NotificationProfilePicture profile={user} />
        <NotificationText style={{ flexShrink: 1 }}>
          {Platform.OS === 'ios' ? messages.sentAlt : messages.sent}{' '}
          <TipText value={uiAmount} /> {messages.to}{' '}
          <UserNameLink user={user} />
        </NotificationText>
      </View>
      <NotificationXButton
        type='dynamic'
        handle={user.handle}
        shareData={handleXShare}
      />
    </NotificationTile>
  )
}
