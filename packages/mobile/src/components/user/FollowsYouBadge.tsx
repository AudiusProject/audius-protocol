import type { ID } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { MusicBadge } from '@audius/harmony-native'
import { trpc } from 'app/services/trpc-client-mobile'

const messages = {
  followsYou: 'Follows You'
}

type FollowsYouBadgeProps = {
  userId: ID
}

export const FollowsYouBadge = (props: FollowsYouBadgeProps) => {
  const { userId } = props
  const currentUserId = useSelector(accountSelectors.getUserId)
  const { data } = trpc.me.userRelationship.useQuery(
    {
      theirId: userId.toString()
    },
    {
      enabled: !!currentUserId
    }
  )

  if (!data?.followsMe) return null

  return <MusicBadge size='s'>{messages.followsYou}</MusicBadge>
}
