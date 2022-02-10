import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'

import IconFollow from 'app/assets/images/iconFollow.svg'
import IconFollowing from 'app/assets/images/iconFollowing.svg'

import { Button } from './Button'

const messages = {
  follow: 'follow',
  following: 'following'
}

type FollowButtonsProps = {
  profile: ProfileUser
}

export const FollowButton = ({ profile }: FollowButtonsProps) => {
  const { does_current_user_follow } = profile
  const isFollowing = does_current_user_follow

  const IconLeft = isFollowing ? IconFollowing : IconFollow

  const variant = isFollowing ? 'primary' : 'secondary'

  return (
    <Button
      title={isFollowing ? messages.following : messages.follow}
      variant={variant}
      iconLeft={IconLeft}
    />
  )
}
