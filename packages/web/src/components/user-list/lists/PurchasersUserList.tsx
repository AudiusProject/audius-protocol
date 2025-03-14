import { usePurchasers } from '@audius/common/api'
import { purchasersUserListSelectors } from '@audius/common/store'

import { useSelector } from 'common/hooks/useSelector'

import { UserList } from '../UserList'

const { getContentId, getContentType } = purchasersUserListSelectors

export const PurchasersUserList = () => {
  const contentId = useSelector(getContentId) ?? undefined
  const contentType = useSelector(getContentType) ?? undefined

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePurchasers({ contentId, contentType })

  return (
    <UserList
      data={data}
      isPending={isPending}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  )
}
