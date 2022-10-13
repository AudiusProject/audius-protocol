import { useCallback, useContext } from 'react'

import type { User as UserType } from '@audius/common'

import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { AppDrawerContext } from 'app/screens/app-drawer-screen'

type UserNameLinkProps = TextProps & {
  user: UserType
}

export const UserNameLink = (props: UserNameLinkProps) => {
  const { user, ...other } = props
  const { drawerHelpers } = useContext(AppDrawerContext)
  const navigation = useNavigation({ customNativeNavigation: drawerHelpers })

  const onPress = useCallback(() => {
    navigation.navigate('Profile', {
      handle: user.handle,
      fromNotifications: true
    })
  }, [user, navigation])

  return (
    <Text
      fontSize='large'
      weight='medium'
      color='secondary'
      onPress={onPress}
      {...other}
    >
      {user.name}
    </Text>
  )
}
