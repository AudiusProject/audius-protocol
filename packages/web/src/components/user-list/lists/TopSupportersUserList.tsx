import { useSupporters, useUser } from '@audius/common/api'
import { topSupportersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const TopSupportersUserList = () => {
  const userId = useSelector(topSupportersUserListSelectors.getId)

  const { data: supporterCount } = useUser(userId, {
    select: (user) => user.supporter_count
  })

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useSupporters({ userId })

  if (!userId) return null

  return (
    <UserList
      data={data?.map((supporter) => supporter.sender.user_id)}
      totalCount={supporterCount}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
      showSupportFor={userId}
    />
  )
}
