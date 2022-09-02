import { useCallback } from 'react'

import type { SupporterRankUpNotification } from '@audius/common'
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
  supporterChange: 'Became your',
  supporter: 'Top Supporter',
  twitterShare: (handle: string, rank: number) =>
    `${handle} just became my #${rank} Top Supporter on @AudiusProject #Audius $AUDIO #AUDIOTip`
}

type TopSupporterNotificationProps = {
  notification: SupporterRankUpNotification
}

export const TopSupporterNotification = (
  props: TopSupporterNotificationProps
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
            EventNames.NOTIFICATIONS_CLICK_SUPPORTER_RANK_UP_TWITTER_SHARE,
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
        user={user}
        title={`#${rank} ${messages.title}`}
        body={`${messages.supporterChange} #${rank} ${messages.supporter}`}
      />
      <NotificationTwitterButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
      />
    </NotificationTile>
  )
}
