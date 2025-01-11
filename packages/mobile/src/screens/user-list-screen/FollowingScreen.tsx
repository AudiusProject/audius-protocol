import { useFollowing } from '@audius/common/api'

import { IconUserList } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Following'
}

export const FollowingScreen = () => {
  const { params } = useProfileRoute<'Following'>()
  const { userId } = params
  const query = useFollowing({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserList}>
      <UserList {...query} tag='FOLLOWING' />
    </UserListScreen>
  )
}
