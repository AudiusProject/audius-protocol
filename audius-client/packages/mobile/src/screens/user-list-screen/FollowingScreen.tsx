import { getUserList } from 'audius-client/src/common/store/user-list/following/selectors'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Following'
}

export const FollowingScreen = () => {
  return (
    <UserListScreen title={messages.title}>
      <UserList userSelector={getUserList} tag='FOLLOWING' />
    </UserListScreen>
  )
}
