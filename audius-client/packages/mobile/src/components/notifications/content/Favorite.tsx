import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Favorite as FavoriteNotification } from '../../../store/notifications/types'
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

type FavoriteProps = {
  notification: FavoriteNotification
  onGoToRoute: (route: string) => void
}

const Favorite = ({ notification, onGoToRoute }: FavoriteProps) => {
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
        {`${otherUsers} favorited your ${entityType.toLowerCase()} `}
        <Entity
          entity={entity}
          entityType={entityType}
          onGoToRoute={onGoToRoute}
        />
      </Text>
    </View>
  )
}

export default Favorite
