import { useReposts } from '@audius/common/api'
import { repostsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const RepostsUserList = () => {
  const trackId = useSelector(repostsUserListSelectors.getId)
  const query = useReposts({ trackId })

  return <UserListV2 {...query} />
}
