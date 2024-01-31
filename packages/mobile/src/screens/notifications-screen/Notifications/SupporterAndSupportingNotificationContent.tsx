import type { User } from '@audius/common/models'
import { View } from 'react-native'

import { IconTipping, IconTrending } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import {
  NotificationHeader,
  NotificationTitle,
  ProfilePicture,
  UserNameLink,
  NotificationText
} from '../Notification'

const useStyles = makeStyles(() => ({
  trendingIcon: {
    marginRight: spacing(2)
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

type SupporterAndSupportingNotificationContentProps = {
  user: User
  title: string
  body: string
}

export const SupporterAndSupportingNotificationContent = ({
  user,
  title,
  body
}: SupporterAndSupportingNotificationContentProps) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  return (
    <>
      <NotificationHeader icon={IconTipping}>
        <NotificationTitle>{title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <UserNameLink user={user} />
      </View>
      <View style={styles.textContainer}>
        <IconTrending
          fill={neutralLight4}
          style={styles.trendingIcon}
          height={18}
        />
        <NotificationText>{body}</NotificationText>
      </View>
    </>
  )
}
