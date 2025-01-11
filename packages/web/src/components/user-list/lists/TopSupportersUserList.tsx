import { useSupporters } from '@audius/common/api'
import { topSupportersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const TopSupportersUserList = () => {
  const userId = useSelector(topSupportersUserListSelectors.getId)
  const query = useSupporters({ userId })

  if (!userId) return null

  return <UserListV2 {...query} showSupportFor={userId} />
}
