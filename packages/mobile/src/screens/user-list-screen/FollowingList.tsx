import { getUserList } from 'audius-client/src/common/store/user-list/following/selectors'

import { UserList } from './UserList'

export const FollowingList = () => {
  return <UserList userSelector={getUserList} tag='FOLLOWING' />
}
