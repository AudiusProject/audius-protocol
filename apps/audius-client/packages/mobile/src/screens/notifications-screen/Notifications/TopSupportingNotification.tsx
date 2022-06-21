import { useCallback } from 'react'

import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { SupportingRankUp } from 'common/store/notifications/types'

import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'

import { NotificationTile, NotificationTwitterButton } from '../Notification'

import { SupporterAndSupportingNotificationContent } from './SupporterAndSupportingNotificationContent'

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter'
}

type TopSupportingNotificationProps = {
  notification: SupportingRankUp
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { rank } = notification

  const user = useSelectorWeb(
    state => getNotificationUser(state, notification),
    isEqual
  )

  const handleTwitterShare = useCallback(
    (handle: string | undefined) => {
      const shareText = `I'm now ${handle}'s #${rank} Top Supporter on @AudiusProject #Audius $AUDIO  #AUDIOTip`
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
    <NotificationTile notification={notification}>
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
