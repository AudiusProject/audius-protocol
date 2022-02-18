import { getUserList } from 'audius-client/src/common/store/user-list/followers/selectors'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Followers'
}

export const FollowersScreen = () => {
  return (
    <UserListScreen title={messages.title}>
      <UserList userSelector={getUserList} tag='FOLLOWERS' />
    </UserListScreen>
  )
}
