import { useCallback } from 'react'

import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import type { ProfilePictureProps as ProfilePictureBaseProps } from 'app/components/user'
import { ProfilePicture as ProfilePictureBase } from 'app/components/user'
import { close } from 'app/store/notifications/actions'
import { makeStyles } from 'app/styles'
import { getUserRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'

const useStyles = makeStyles(({ palette, spacing }) => ({
  image: {
    height: spacing(10) - 2,
    width: spacing(10) - 2,
    borderRadius: spacing(5),
    borderColor: palette.white,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight4,
    marginRight: spacing(2)
  }
}))

type ProfilePictureProps = ProfilePictureBaseProps & {
  navigationType?: 'push' | 'navigate'
  interactive?: boolean
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const {
    profile,
    style,
    navigationType = 'navigate',
    interactive = true,
    ...other
  } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    navigation[navigationType]({
      native: {
        screen: 'Profile',
        params: { handle: profile.handle, fromNotifications: true }
      },
      web: { route: getUserRoute(profile), fromPage: NOTIFICATION_PAGE }
    })
    dispatch(close())
  }, [navigation, navigationType, profile, dispatch])

  const profilePictureElement = (
    <ProfilePictureBase
      profile={profile}
      style={[styles.image, style]}
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
