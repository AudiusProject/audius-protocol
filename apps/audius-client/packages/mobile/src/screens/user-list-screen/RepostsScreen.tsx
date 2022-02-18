import { getUserList } from 'audius-client/src/common/store/user-list/reposts/selectors'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Reposts'
}

export const RepostsScreen = () => {
  return (
    <UserListScreen title={messages.title}>
      <UserList userSelector={getUserList} tag='REPOSTS' />
    </UserListScreen>
  )
}
