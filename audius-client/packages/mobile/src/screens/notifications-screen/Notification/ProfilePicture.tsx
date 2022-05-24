import { useCallback } from 'react'

import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  ProfilePicture as ProfilePictureBase,
  ProfilePictureProps as ProfilePictureBaseProps
} from 'app/components/user'
import { makeStyles } from 'app/styles'
import { getUserRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'

const useStyles = makeStyles(({ palette, spacing }) => ({
  image: {
    height: spacing(10),
    width: spacing(10),
    borderRadius: spacing(5),
    borderColor: palette.white,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight4,
    marginRight: spacing(2)
  }
}))

type ProfilePictureProps = ProfilePictureBaseProps

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { profile, style, ...other } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate({
      native: {
        screen: 'Profile',
        params: { handle: profile.handle, fromNotifications: true }
      },
      web: { route: getUserRoute(profile), fromPage: NOTIFICATION_PAGE }
    })
    dispatch(close())
  }, [navigation, profile, dispatch])

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <ProfilePictureBase
        profile={profile}
        style={[styles.image, style]}
        {...other}
      />
    </TouchableOpacity>
  )
}
