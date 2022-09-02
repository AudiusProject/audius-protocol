import { useCallback } from 'react'

import type { SupportingRankUpNotification } from '@audius/common'
import { notificationsSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { NotificationTile, NotificationTwitterButton } from '../Notification'

import { SupporterAndSupportingNotificationContent } from './SupporterAndSupportingNotificationContent'
import { useGoToProfile } from './useGoToProfile'
const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter',
  twitterShare: (handle: string, rank: number) =>
    `I'm now ${handle}'s #${rank} Top Supporter on @AudiusProject #Audius $AUDIO #AUDIOTip`
}

type TopSupportingNotificationProps = {
  notification: SupportingRankUpNotification
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { rank } = notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  const handlePress = useGoToProfile(user)

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.twitterShare(handle, rank)
      return {
        shareText,
        analytics: make({
          eventName:
            EventNames.NOTIFICATIONS_CLICK_SUPPORTING_RANK_UP_TWITTER_SHARE,
          text: shareText
        })
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
      <NotificationTwitterButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
      />
    </NotificationTile>
  )
}
