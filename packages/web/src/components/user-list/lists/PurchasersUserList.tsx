import { usePurchases } from '@audius/common/api'
import { purchasersUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const PurchasersUserList = () => {
  const userId = useSelector(purchasersUserListSelectors.getId)
  const query = usePurchases({ userId })

  const transformedQuery = {
    ...query,
    data: query.data?.pages
      .flatMap((page) => page.purchases)
      .map((purchase) => purchase.buyer),
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage()
  }

  return <UserListV2 {...transformedQuery} />
}
