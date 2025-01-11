import { useSupportedUsers } from '@audius/common/api'
import { supportingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const SupportingUserList = () => {
  const userId = useSelector(supportingUserListSelectors.getId)
  const query = useSupportedUsers({ userId })

  return (
    <UserListV2
      {...query}
      data={query.data?.map((supporter) => supporter.receiver)}
    />
  )
}
