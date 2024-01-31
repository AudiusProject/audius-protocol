import { useCallback } from 'react'

import type { TipSendNotification } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'

import { useUIAudio } from '@audius/common/hooks'
import { Platform, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconTip from 'app/assets/images/iconTip.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
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

const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Your Tip Was Sent!',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: 'Your $AUDIO Was Sent!', // iOS only
  sent: 'You successfully sent a tip of',
  sentAlt: 'You successfully sent', // iOS only
  to: 'to',
  // NOTE: Send tip -> Send $AUDIO changes
  twitterShare: (senderHandle: string, uiAmount: number, ios: boolean) =>
    `I just ${
      ios ? 'tipped' : 'sent'
    } ${senderHandle} ${uiAmount} $AUDIO on @audius #Audius ${
      ios ? '$#AUDIO' : '#AUDIOTip'
    }`
}

type TipSentNotificationProps = {
  notification: TipSendNotification
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props

  const { amount } = notification
  const uiAmount = useUIAudio(amount)
  const navigation = useNotificationNavigation()

  const user = useSelector((state) => getNotificationUser(state, notification))

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleTwitterShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(
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
      <NotificationHeader icon={IconTip}>
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
        <ProfilePicture profile={user} />
        <NotificationText style={{ flexShrink: 1 }}>
          {Platform.OS === 'ios' ? messages.sentAlt : messages.sent}{' '}
          <TipText value={uiAmount} /> {messages.to}{' '}
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
