import { useSupportedUsers } from '@audius/common/api'
import { supportingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from '../UserListV2'

export const SupportingUserList = () => {
  const userId = useSelector(supportingUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useSupportedUsers({ userId })

  return (
    <UserListV2
      data={data?.map((supporter) => supporter.receiver)}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
