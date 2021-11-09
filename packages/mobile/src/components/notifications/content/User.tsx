import React, { useCallback } from 'react'

import { StyleSheet, Text } from 'react-native'

import { getUserRoute } from 'app/utils/routes'
import { useTheme } from 'app/utils/theme'

const styles = StyleSheet.create({
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16
  }
})

type UserProps = {
  user: any
  onGoToRoute: (route: string) => void
}

const User = ({ user, onGoToRoute }: UserProps) => {
  const onPress = useCallback(() => {
    onGoToRoute(getUserRoute(user))
  }, [user, onGoToRoute])

  const textStyle = useTheme(styles.text, {
    color: 'secondary'
  })

  return (
    <Text style={textStyle} onPress={onPress}>
      {user.name}
    </Text>
  )
}

export default User
