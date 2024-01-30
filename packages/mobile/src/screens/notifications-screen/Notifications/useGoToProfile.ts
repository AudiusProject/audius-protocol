import { useCallback } from 'react'

import type { Nullable } from '@audius/common'
import type { User } from '@audius/common/models'

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
