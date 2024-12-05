import type { ID, User } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { AvatarProps } from '@audius/harmony-native'
import { Avatar } from '@audius/harmony-native'

import { useProfilePicture } from '../image/UserImage'
const { getUser } = cacheUsersSelectors

const messages = {
  profilePictureFor: 'Profile picture for'
}

type BaseAvatarProps = Omit<AvatarProps, 'source' | 'accessibilityLabel'>

// User should prefer userId, and provide user if it's not in the cache
type ProfilePictureUserProps =
  | {
      userId: ID | undefined
    }
  | { user: Pick<User, 'user_id' | 'name' | 'profile_picture_sizes'> }

export type ProfilePictureProps = BaseAvatarProps & ProfilePictureUserProps

export const ProfilePicture = (props: ProfilePictureProps) => {
  const userId = 'user' in props ? props.user.user_id : props.userId

  const accessibilityLabel = useSelector((state) => {
    const userName =
      'user' in props ? props.user.name : getUser(state, { id: userId })?.name
    return `${messages.profilePictureFor} ${userName}`
  })

  const { source } = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_150_BY_150
  })

  return source ? (
    <Avatar
      source={source}
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  ) : null
}
