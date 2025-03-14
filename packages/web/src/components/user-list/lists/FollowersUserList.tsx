import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const FollowersUserList = () => {
  const userId = useSelector(followersUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useFollowers({ userId })

  return (
    <UserListV2
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
