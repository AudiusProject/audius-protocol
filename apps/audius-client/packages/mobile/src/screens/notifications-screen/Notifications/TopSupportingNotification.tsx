import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TopSupporting } from 'common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemeColors } from 'app/utils/theme'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  NotificationText,
  ProfilePicture
} from '../Notification'
import { UserNameLink } from '../Notification/UserNameLink'

const messages = {
  title: 'Top Supporter',
  supporterChange: 'Became your',
  supporter: 'Top Supporter'
}

type TopSupportingNotificationProps = {
  notification: TopSupporting
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { userId, rank } = notification
  const user = useSelectorWeb(state => getUser(state, { id: userId }))
  const { neutral } = useThemeColors()

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>
          #{rank} {messages.title}
        </NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <UserNameLink user={user} />
      </View>
      <NotificationText>
        <IconTrending fill={neutral} />
        {messages.supporterChange} #{rank} {messages.supporter}
      </NotificationText>
    </NotificationTile>
  )
}
