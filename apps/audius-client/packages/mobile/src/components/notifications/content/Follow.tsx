import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Follow as FollowNotification } from '../../../store/notifications/types'
import UserImages from './UserImages'
import { formatCount } from '../../../utils/format'
import User from './User'
import { useTheme } from '../../../utils/theme'

const styles = StyleSheet.create({
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16
  }
})

type FollowProps = {
  notification: FollowNotification
  onGoToRoute: (route: string) => void
}

const Follow = ({ notification, onGoToRoute }: FollowProps) => {
  const firstUser = notification.users[0]
  let otherUsers = ''
  if (notification.userIds.length > 1) {
    const usersLen = notification.userIds.length - 1
    otherUsers = ` and ${formatCount(usersLen)} other${usersLen > 1 ? 's' : ''}`
  }

  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  return (
    <View>
      <UserImages
        notification={notification}
        users={notification.users}
        onGoToRoute={onGoToRoute}
      />
      <Text style={textWrapperStyle}>
        <User user={firstUser} onGoToRoute={onGoToRoute} />
        {`${otherUsers} Followed you`}
      </Text>
    </View>
  )
}

export default Follow
