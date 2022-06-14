import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { SupporterRankUp } from 'common/store/notifications/types'

import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { NotificationTile } from '../Notification'

import { SupporterAndSupportingNotificationContent } from './SupporterAndSupportingNotificationContent'

const messages = {
  title: 'Top Supporter',
  supporterChange: 'Became your',
  supporter: 'Top Supporter'
}

type TopSupporterNotificationProps = {
  notification: SupporterRankUp
}

export const TopSupporterNotification = (
  props: TopSupporterNotificationProps
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
        user={user}
        title={`#${rank} ${messages.title}`}
        body={`${messages.supporterChange} #${rank} ${messages.supporter}`}
      />
    </NotificationTile>
  )
}
