import { getUserList } from 'audius-client/src/common/store/user-list/favorites/selectors'

import { UserList } from './UserList'

export const FavoritesList = () => {
  return <UserList userSelector={getUserList} tag='FAVORITES' />
}
