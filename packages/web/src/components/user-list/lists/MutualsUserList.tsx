import { useMutualFollowers } from '@audius/common/api'
import { mutualsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from '../UserListV2'

export const MutualsUserList = () => {
  const userId = useSelector(mutualsUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useMutualFollowers({ userId })

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
