import { User } from 'audius-client/src/common/models/User'
import { View } from 'react-native'

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
}

export const ProfilePictureList = (props: ProfilePictureListProps) => {
  const { users } = props
  const styles = useStyles()

  return (
    <View style={styles.root}>
      {users.map(user => (
        <ProfilePicture
          profile={user}
          key={user.user_id}
          style={styles.image}
        />
      ))}
    </View>
  )
}
