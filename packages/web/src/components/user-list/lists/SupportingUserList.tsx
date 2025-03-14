import { useSupportedUsers } from '@audius/common/api'
import { supportingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const SupportingUserList = () => {
  const userId = useSelector(supportingUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useSupportedUsers({ userId })

  return (
    <UserList
      data={data?.map((supporter) => supporter.receiver)}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
