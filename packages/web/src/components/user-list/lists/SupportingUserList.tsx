import { useSupportedUsers, useUser } from '@audius/common/api'
import { supportingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const SupportingUserList = () => {
  const userId = useSelector(supportingUserListSelectors.getId)

  const { data: supportingCount } = useUser(userId, {
    select: (user) => user.supporting_count
  })

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useSupportedUsers({ userId })

  if (!userId) return null

  return (
    <UserList
      data={data?.map((supporter) => supporter.receiver.user_id)}
      totalCount={supportingCount}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
      showSupportFrom={userId}
    />
  )
}
