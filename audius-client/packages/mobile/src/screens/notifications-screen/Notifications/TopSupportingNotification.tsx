import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { SupportingRankUp } from 'common/store/notifications/types'

import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { NotificationTile } from '../Notification'

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

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <SupporterAndSupportingNotificationContent
        title={`#${rank} ${messages.title}`}
        body={`${messages.supporterChange} #${rank} ${messages.supporter}`}
        user={user}
      />
    </NotificationTile>
  )
}
