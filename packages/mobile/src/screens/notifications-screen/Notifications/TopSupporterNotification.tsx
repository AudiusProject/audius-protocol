import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { SupporterRankUp } from 'common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemeColors } from 'app/utils/theme'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  NotificationText,
  ProfilePicture,
  UserNameLink
} from '../Notification'

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
  const { neutral } = useThemeColors()

  const user = useSelectorWeb(
    state => getNotificationUser(state, notification),
    isEqual
  )
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
