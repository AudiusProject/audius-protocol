import { useRemixers } from '@audius/common/api'
import { remixersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const RemixersUserList = () => {
  const userId = useSelector(remixersUserListSelectors.getId)
  const query = useRemixers({ userId })

  return <UserListV2 {...query} />
}
