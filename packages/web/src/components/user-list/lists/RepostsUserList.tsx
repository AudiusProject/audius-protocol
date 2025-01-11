import { useReposts } from '@audius/common/api'
import { repostsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const RepostsUserList = () => {
  const trackId = useSelector(repostsUserListSelectors.getId)
  const query = useReposts({ trackId })

  return <UserList {...query} />
}
