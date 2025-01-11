import { useSupporters } from '@audius/common/api'
import { topSupportersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const TopSupportersUserList = () => {
  const userId = useSelector(topSupportersUserListSelectors.getId)
  const query = useSupporters({ userId })

  if (!userId) return null

  return (
    <UserList
      {...query}
      data={query.data?.map((supporter) => supporter.sender)}
      showSupportFor={userId}
    />
  )
}
