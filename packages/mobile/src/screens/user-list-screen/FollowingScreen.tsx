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
  const { data, isFetchingNextPage, isPending, fetchNextPage } = useFollowing({
    userId
  })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserList}>
      <UserList
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='FOLLOWING'
      />
    </UserListScreen>
  )
}
