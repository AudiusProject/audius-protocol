import { getUserList } from 'audius-client/src/common/store/user-list/favorites/selectors'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Favorites'
}

export const FavoritedScreen = () => {
  return (
    <UserListScreen title={messages.title}>
      <UserList userSelector={getUserList} tag='FAVORITES' />
    </UserListScreen>
  )
}
