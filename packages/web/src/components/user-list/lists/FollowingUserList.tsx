import { useFollowing } from '@audius/common/api'
import { followingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const FollowingUserList = () => {
  const userId = useSelector(followingUserListSelectors.getId)
  const query = useFollowing({ userId })

  return <UserList {...query} />
}
