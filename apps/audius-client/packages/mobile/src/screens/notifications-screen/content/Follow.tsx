import { Follow as FollowNotification } from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { formatCount } from 'app/utils/format'
import { useTheme } from 'app/utils/theme'

import User from './User'
import UserImages from './UserImages'

const styles = StyleSheet.create({
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16
  }
})

type FollowProps = {
  notification: FollowNotification
}

const Follow = ({ notification }: FollowProps) => {
  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  const firstUser = notification?.users?.[0]
  if (!firstUser) return null
  let otherUsers = ''
  if (notification.userIds.length > 1) {
    const usersLen = notification.userIds.length - 1
    otherUsers = ` and ${formatCount(usersLen)} other${usersLen > 1 ? 's' : ''}`
  }

  return (
    <View>
      {notification.users ? (
        <UserImages notification={notification} users={notification.users} />
      ) : null}
      <Text style={textWrapperStyle}>
        <User user={firstUser} />
        {`${otherUsers} Followed you`}
      </Text>
    </View>
  )
}

export default Follow
