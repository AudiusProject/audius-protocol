import { User } from 'audius-client/src/common/models/User'
import { StyleProp, View, ViewStyle } from 'react-native'

import { makeStyles } from 'app/styles'

import { ProfilePicture } from './ProfilePicture'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row'
  },
  image: {
    marginRight: spacing(-2)
  }
}))

type ProfilePictureListProps = {
  users: User[]
  style?: StyleProp<ViewStyle>
  navigationType?: 'push' | 'navigate'
  interactive?: boolean
  imageStyles?: {
    width?: number | string | undefined
    height?: number | string | undefined
  }
}

export const ProfilePictureList = (props: ProfilePictureListProps) => {
  const { users, style, navigationType, interactive, imageStyles } = props
  const styles = useStyles()

  return (
    <View style={[styles.root, style]}>
      {users.map(user => (
        <ProfilePicture
          profile={user}
          key={user.user_id}
          style={{ ...styles.image, ...imageStyles }}
          navigationType={navigationType}
          interactive={interactive}
        />
      ))}
    </View>
  )
}
