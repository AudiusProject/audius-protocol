import { useFollowers, useUser } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const FollowersUserList = () => {
  const userId = useSelector(followersUserListSelectors.getId)
  const { data: user } = useUser(userId)
  const followerCount = user?.follower_count

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useFollowers({ userId })

  return (
    <UserList
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
      count={followerCount}
    />
  )
}
