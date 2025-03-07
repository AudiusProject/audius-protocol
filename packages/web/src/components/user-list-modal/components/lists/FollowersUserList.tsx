import { useFollowers } from '@audius/common/api'
import { followersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

type FollowersUserListProps = {
  getScrollParent: () => HTMLElement | null
  onClose: () => void
}

export const FollowersUserList = ({
  onClose,
  getScrollParent
}: FollowersUserListProps) => {
  const userId = useSelector(followersUserListSelectors.getId)
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isPending
  } = useFollowers({ userId })

  console.log(
    data && data?.length > 0,
    isLoading,
    isPending,
    isFetchingNextPage,
    hasNextPage
  )

  return (
    <UserListV2
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      onNavigateAway={onClose}
      afterFollow={onClose}
      afterUnfollow={onClose}
      getScrollParent={getScrollParent}
    />
  )
}
