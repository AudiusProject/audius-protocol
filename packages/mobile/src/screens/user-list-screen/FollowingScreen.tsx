import { useFollowing } from '@audius/common/api'

import { IconUserList } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Following'
}

export const FollowingScreen = () => {
  const { params } = useProfileRoute<'Following'>()
  const { userId } = params
  const query = useFollowing({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserList}>
      <UserListV2 {...query} tag='FOLLOWING' />
    </UserListScreen>
  )
}
