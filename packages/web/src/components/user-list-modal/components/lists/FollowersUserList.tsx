import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

type FollowersUserListProps = {
  onClose: () => void
}

export const FollowersUserList = ({ onClose }: FollowersUserListProps) => {
  const userId = useSelector(followersUserListSelectors.getId)
  const {
    data = [],
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isPending
  } = useFollowers({
    userId
  })

  return (
    <UserListV2
      data={data}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      isLoading={isPending}
      loadMore={fetchNextPage}
      onNavigateAway={onClose}
      afterFollow={onClose}
      afterUnfollow={onClose}
    />
  )
}
