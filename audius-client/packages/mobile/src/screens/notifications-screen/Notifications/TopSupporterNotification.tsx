import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TopSupporter } from 'common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemeColors } from 'app/utils/theme'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  ProfilePicture,
  UserNameLink,
  NotificationText
} from '../Notification'

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter'
}

type TopSupporterNotificationProps = {
  notification: TopSupporter
}

export const TopSupporterNotification = (
  props: TopSupporterNotificationProps
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
