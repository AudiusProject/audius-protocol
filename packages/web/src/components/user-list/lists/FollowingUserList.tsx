import { useFollowing, useUser } from '@audius/common/api'
import { followingUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const FollowingUserList = () => {
  const userId = useSelector(followingUserListSelectors.getId)

  const { data: followerCount } = useUser(userId, {
    select: (user) => user.followee_count
  })

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useFollowing({ userId })

  return (
    <UserList
      data={data}
      totalCount={followerCount}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
