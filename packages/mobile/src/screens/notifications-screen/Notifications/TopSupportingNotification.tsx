import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import type { SupportingRankUpNotification } from '@audius/common/store'
import { Platform } from 'react-native'

import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { env } from 'app/services/env'
import { EventNames } from 'app/types/analytics'

import { NotificationTile, NotificationXButton } from '../Notification'

import { SupporterAndSupportingNotificationContent } from './SupporterAndSupportingNotificationContent'

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter',
  // NOTE: Send tip -> Send $AUDIO change
  twitterShare: (handle: string, rank: number, ios: boolean) =>
    `I'm now ${handle}'s #${rank} Top Supporter on @audius #Audius $AUDIO${
      ios ? '' : ' #AUDIOTip'
    }`
}

type TopSupportingNotificationProps = {
  notification: SupportingRankUpNotification
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const navigation = useNotificationNavigation()

  const { data: user } = useUser(notification.entityId)

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.twitterShare(
        handle,
        rank,
        Platform.OS === 'ios'
      )
      return {
        shareText,
        analytics: {
          eventName:
            EventNames.NOTIFICATIONS_CLICK_SUPPORTING_RANK_UP_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [rank]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <SupporterAndSupportingNotificationContent
        title={`#${rank} ${messages.title}`}
        body={`${messages.supporterChange} #${rank} ${messages.supporter}`}
        user={user}
      />
      <NotificationXButton
        type='dynamic'
        handle={user.handle}
        url={`${env.AUDIUS_URL}/${user.handle}`}
        shareData={handleTwitterShare}
      />
    </NotificationTile>
  )
}
