import { useUser } from '@audius/common/api'
import type { ID, User } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'

import type { AvatarProps } from '@audius/harmony-native'
import { Avatar } from '@audius/harmony-native'

import { useProfilePicture } from '../image/UserImage'

const messages = {
  profilePictureFor: 'Profile picture for'
}

type BaseAvatarProps = Omit<AvatarProps, 'source' | 'accessibilityLabel'>

// User should prefer userId, and provide user if it's not in the cache
type ProfilePictureUserProps =
  | {
      userId: ID | undefined | null
    }
  | { user: Pick<User, 'user_id' | 'name' | 'profile_picture_sizes'> }

export type ProfilePictureProps = BaseAvatarProps & ProfilePictureUserProps

export const ProfilePicture = (props: ProfilePictureProps) => {
  const userId = 'user' in props ? props.user.user_id : props.userId

  const { data: userQuery } = useUser(userId, { enabled: !('user' in props) })
  const user = 'user' in props ? props.user : userQuery

  const accessibilityLabel = `${messages.profilePictureFor} ${user?.name}`

  const { source } = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <Avatar
      source={source}
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  )
}
