import { useCallback } from 'react'

import type { ID } from '@audius/common'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { TouchableOpacity } from 'react-native'

import { ProfilePicture } from 'app/components/core'
import type { ProfilePictureProps } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

type NotificationProfilePictureProps = Partial<ProfilePictureProps> & {
  profile: { user_id: ID; handle: string }
  navigationType?: 'push' | 'navigate'
  interactive?: boolean
}

export const NotificationProfilePicture = (
  props: NotificationProfilePictureProps
) => {
  const {
    profile,
    style,
    navigationType = 'navigate',
    interactive = true,
    ...other
  } = props
  const { spacing } = useTheme()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    if (profile) {
      const screen = 'Profile'
      const params = {
        handle: profile.handle,
        fromNotifications: true
      }
      if (navigationType === 'push') navigation.push(screen, params)
      if (navigationType === 'navigate') navigation.navigate(screen, params)
    }
  }, [navigation, navigationType, profile])

  const profilePictureElement = (
    <ProfilePicture
      userId={profile.user_id}
      size='medium'
      style={[css({ marginRight: spacing.s }), style]}
      {...other}
    />
  )

  if (interactive) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={interactive ? handlePress : undefined}
      >
        {profilePictureElement}
      </TouchableOpacity>
    )
  }

  return profilePictureElement
}
