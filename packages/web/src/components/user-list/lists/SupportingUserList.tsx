import { useSupportedUsers } from '@audius/common/api'
import { supportingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const SupportingUserList = () => {
  const userId = useSelector(supportingUserListSelectors.getId)
  const query = useSupportedUsers({ userId })

  return (
    <UserList
      {...query}
      data={query.data?.map((supporter) => supporter.receiver)}
    />
  )
}
