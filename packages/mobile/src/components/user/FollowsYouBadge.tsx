import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { MusicBadge } from '@audius/harmony-native'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  userId: ID
}

export const FollowsYouBadge = (props: FollowsYouBadgeProps) => {
  const { userId } = props
  const { data: doesFollowCurrentUser } = useUser(userId, {
    select: (user) => user?.does_follow_current_user
  })
  if (!doesFollowCurrentUser) return null

  return <MusicBadge size='s'>{messages.followsYou}</MusicBadge>
}
