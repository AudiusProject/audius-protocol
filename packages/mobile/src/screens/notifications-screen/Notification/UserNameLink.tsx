import { useCallback } from 'react'

import type { User as UserType } from '@audius/common/models'

import type { TextProps } from 'app/components/core'
import { Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

type UserNameLinkProps = TextProps & {
  user: UserType
  isOwner?: boolean
}

export const UserNameLink = (props: UserNameLinkProps) => {
  const { user, isOwner, ...other } = props
  const navigation = useNavigation()

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
      {isOwner ? "'s" : null}
    </Text>
  )
}
