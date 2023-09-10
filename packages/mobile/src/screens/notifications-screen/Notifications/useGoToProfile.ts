import { useCallback } from 'react'

import type { User, Nullable } from '@audius/common'

import { useNavigation } from 'app/hooks/useNavigation'

export const useGoToProfile = (user: Nullable<User> | undefined) => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    if (!user) return
    navigation.navigate('Profile', {
      handle: user.handle,
      fromNotifications: true
    })
  }, [user, navigation])

  return handlePress
}
