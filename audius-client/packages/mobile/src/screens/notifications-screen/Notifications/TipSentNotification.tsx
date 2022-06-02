import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TipSent } from 'audius-client/src/common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  ProfilePicture
} from '../Notification'
import { TipText } from '../Notification/TipText'
import { UserNameLink } from '../Notification/UserNameLink'

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to'
}

type TipSentNotificationProps = {
  notification: TipSent
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props
  const { userId, value } = notification
  const user = useSelectorWeb(state => getUser(state, { id: userId }))

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <NotificationText>
          {messages.sent} <TipText value={value} /> {messages.to}{' '}
          <UserNameLink user={user} />
        </NotificationText>
      </View>
    </NotificationTile>
  )
}
