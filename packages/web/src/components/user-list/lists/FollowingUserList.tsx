import { useFollowing } from '@audius/common/api'
import { followingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const FollowingUserList = () => {
  const userId = useSelector(followingUserListSelectors.getId)
  const query = useFollowing({ userId })

  return <UserListV2 {...query} />
}
