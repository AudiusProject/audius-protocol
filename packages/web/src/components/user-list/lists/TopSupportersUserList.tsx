import { useSupporters } from '@audius/common/api'
import { topSupportersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const TopSupportersUserList = () => {
  const userId = useSelector(topSupportersUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useSupporters({ userId })

  if (!userId) return null

  return (
    <UserList
      data={data?.map((supporter) => supporter.sender)}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
      showSupportFor={userId}
    />
  )
}
