import { useMutualFollowers } from '@audius/common/api'
import { mutualsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const MutualsUserList = () => {
  const userId = useSelector(mutualsUserListSelectors.getId)
  const query = useMutualFollowers({ userId })

  return <UserListV2 {...query} />
}
