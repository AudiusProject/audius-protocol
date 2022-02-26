import { User } from 'audius-client/src/common/models/User'
import { StyleProp, ViewStyle } from 'react-native'

import IconFollow from 'app/assets/images/iconFollow.svg'
import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { Button, ButtonProps } from 'app/components/core'

const messages = {
  follow: 'follow',
  following: 'following'
}

type FollowButtonsProps = Partial<ButtonProps> & {
  profile: User
  noIcon?: boolean
  style?: StyleProp<ViewStyle>
}

export const FollowButton = (props: FollowButtonsProps) => {
  const { profile, noIcon, style, onPress } = props
  const { does_current_user_follow } = profile
  const isFollowing = does_current_user_follow

  const Icon = isFollowing ? IconFollowing : IconFollow

  const variant = isFollowing ? 'primary' : 'secondary'

  return (
    <Button
      style={style}
      title={isFollowing ? messages.following : messages.follow}
      variant={variant}
      icon={noIcon ? undefined : Icon}
      iconPosition='left'
      size='small'
      onPress={onPress}
    />
  )
}
