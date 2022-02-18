import { User } from 'audius-client/src/common/models/User'

import IconFollow from 'app/assets/images/iconFollow.svg'
import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { Button } from 'app/components/core'

const messages = {
  follow: 'follow',
  following: 'following'
}

type FollowButtonsProps = {
  profile: User
  noIcon?: boolean
}

export const FollowButton = ({ profile, noIcon }: FollowButtonsProps) => {
  const { does_current_user_follow } = profile
  const isFollowing = does_current_user_follow

  const Icon = isFollowing ? IconFollowing : IconFollow

  const variant = isFollowing ? 'primary' : 'secondary'

  return (
    <Button
      title={isFollowing ? messages.following : messages.follow}
      variant={variant}
      icon={noIcon ? undefined : Icon}
      iconPosition='left'
      size='small'
    />
  )
}
