import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const FollowersUserList = () => {
  const userId = useSelector(followersUserListSelectors.getId)
  const query = useFollowers({ userId })

  return <UserListV2 {...query} />
}
