import { useRemixers } from '@audius/common/api'
import { remixersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const RemixersUserList = () => {
  const userId = useSelector(remixersUserListSelectors.getId)
  const query = useRemixers({ userId })

  return <UserList {...query} />
}
