import { useMutualFollowers } from '@audius/common/api'
import { mutualsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const MutualsUserList = () => {
  const userId = useSelector(mutualsUserListSelectors.getId)
  const query = useMutualFollowers({ userId })

  return <UserList {...query} />
}
