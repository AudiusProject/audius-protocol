import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { Follow as FollowNotification } from 'app/store/notifications/types'
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
  onGoToRoute: (route: string) => void
}

const Follow = ({ notification, onGoToRoute }: FollowProps) => {
  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  const firstUser = notification.users[0]
  if (!firstUser) return null
  let otherUsers = ''
  if (notification.userIds.length > 1) {
    const usersLen = notification.userIds.length - 1
    otherUsers = ` and ${formatCount(usersLen)} other${usersLen > 1 ? 's' : ''}`
  }

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
