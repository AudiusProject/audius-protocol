import { useCallback } from 'react'

import { cacheUsersSelectors, notificationsSelectors } from '@audius/common'
import type { SupporterDethronedNotification as SupporterDethroned } from '@audius/common'
import type { Nullable } from '@audius/common/utils'
import { Platform } from 'react-native'
import { useSelector } from 'react-redux'

import IconCrownSource from 'app/assets/images/crown2x.png'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'

import {
  NotificationBody,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton,
  ProfilePicture,
  UserNameLink
} from '../Notification'

const { getUser } = cacheUsersSelectors
const { getNotificationUser } = notificationsSelectors

type SupporterDethronedNotificationProps = {
  notification: SupporterDethroned
}

const messages = {
  title: "You've Been Dethroned!",
  body1: ' Dethroned You as ',
  body2: "'s #1 Top Supporter! Tip to Reclaim Your Spot?",
  // NOTE: Send tip -> Send $AUDIO change
  body2Alt: "'s #1 Top Supporter! Send $AUDIO to Reclaim Your Spot?", // iOS only
  twitterShare: (usurperHandle: string, supportingHandle: string) =>
    `I've been dethroned! ${usurperHandle} dethroned me as ${supportingHandle}'s #1 Top Supporter! #Audius $AUDIO #AUDIOTip`
}

export const SupporterDethronedNotification = (
  props: SupporterDethronedNotificationProps
) => {
  const { notification } = props
  const { supportedUserId } = notification
  const navigation = useNotificationNavigation()
  const usurpingUser = useSelector((state) =>
    getNotificationUser(state, notification)
  )

  const supportedUser = useSelector((state) =>
    getUser(state, { id: supportedUserId })
  )

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleShare = useCallback(
    (usurpingHandle: string, supportingHandle?: Nullable<string>) => {
      // This shouldn't happen
      if (!supportingHandle) {
        return null
      }
      const shareText = messages.twitterShare(usurpingHandle, supportingHandle)
      return {
        shareText,
        analytics: {
          eventName: EventNames.NOTIFICATIONS_CLICK_DETHRONED_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    []
  )

  if (!usurpingUser || !supportedUser) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader imageSource={IconCrownSource}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <ProfilePicture profile={supportedUser} />
        <NotificationText>
          <UserNameLink user={usurpingUser} />
          {messages.body1}
          <UserNameLink user={supportedUser} />
          {Platform.OS === 'ios' ? messages.body2Alt : messages.body2}
        </NotificationText>
      </NotificationBody>
      <NotificationTwitterButton
        type='dynamic'
        handle={usurpingUser.handle}
        additionalHandle={supportedUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
