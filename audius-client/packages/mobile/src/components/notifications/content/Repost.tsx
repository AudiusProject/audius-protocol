import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Repost as RepostNotification } from '../../../store/notifications/types'
import UserImages from './UserImages'
import { formatCount } from '../../../utils/format'
import User from './User'
import Entity from './Entity'
import { useTheme } from '../../../utils/theme'

const styles = StyleSheet.create({
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16
  }
})

type RepostProps = {
  notification: RepostNotification
  onGoToRoute: (route: string) => void
}

const Repost = ({ notification, onGoToRoute }: RepostProps) => {
  const firstUser = notification.users[0]
  let otherUsers = ''
  if (notification.userIds.length > 1) {
    const usersLen = notification.userIds.length - 1
    otherUsers = ` and ${formatCount(usersLen)} other${usersLen > 1 ? 's' : ''}`
  }
  const entityType = notification.entityType
  const entity = notification.entity

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
        {`${otherUsers} Reposted your ${entityType.toLowerCase()} `}
        <Entity
          entity={entity}
          entityType={entityType}
          onGoToRoute={onGoToRoute}
        />
      </Text>
    </View>
  )
}

export default Repost
