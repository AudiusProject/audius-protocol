import { useCallback, useContext } from 'react'

import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'

import { DynamicImage } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { NotificationsDrawerNavigationContext } from 'app/screens/notifications-screen/NotificationsDrawerNavigationContext'
import { close } from 'app/store/notifications/actions'
import { makeStyles } from 'app/styles'
import { getUserRoute } from 'app/utils/routes'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    flexDirection: 'row'
  },
  image: {
    height: spacing(10),
    width: spacing(10),
    borderRadius: spacing(5),
    borderColor: palette.white,
    borderWidth: 2,
    marginRight: -8,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight4
  }
}))

type ProfilePictureListProps = {
  users: User[]
}

const UserImage = (props: { user: User }) => {
  const { user } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)
  const navigation = useNavigation({ customNativeNavigation: drawerHelpers })

  const handlePress = useCallback(() => {
    navigation.navigate({
      native: {
        screen: 'Profile',
        params: { handle: user.handle, fromNotifications: true }
      },
      web: { route: getUserRoute(user), fromPage: NOTIFICATION_PAGE }
    })
    dispatch(close())
  }, [navigation, user, dispatch])

  const profilePicture = useUserProfilePicture({
    id: user?.user_id,
    sizes: user?._profile_picture_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <DynamicImage style={styles.image} uri={profilePicture} />
    </TouchableOpacity>
  )
}

export const ProfilePictureList = (props: ProfilePictureListProps) => {
  const { users } = props
  const styles = useStyles()

  return (
    <View style={styles.root}>
      {users.map(user => (
        <UserImage user={user} key={user.user_id} />
      ))}
    </View>
  )
}
