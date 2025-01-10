import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

type FollowersUserListProps = {
  onClose: () => void
}

export const FollowersUserList = ({ onClose }: FollowersUserListProps) => {
  const userId = useSelector(followersUserListSelectors.getId)
  const { data, hasMore, isLoadingMore, loadMore, isLoading } = useFollowers({
    userId
  })

  return (
    <UserListV2
      data={data}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      isLoading={isLoading}
      loadMore={loadMore}
      onNavigateAway={onClose}
      afterFollow={onClose}
      afterUnfollow={onClose}
    />
  )
}
