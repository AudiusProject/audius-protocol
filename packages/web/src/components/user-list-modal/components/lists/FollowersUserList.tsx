import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const FollowersUserList = () => {
  const userId = useSelector(followersUserListSelectors.getId)
  const query = useFollowers({ userId })

  return <UserList {...query} />
}
