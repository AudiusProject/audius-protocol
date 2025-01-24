import { full, Id } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

import { purchaseFromSDK } from '~/adapters/purchase'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '~/models/USDCTransactions'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useTracks } from './useTracks'
import { useUsers } from './useUsers'

const PAGE_SIZE = 10

export type GetPurchaseListArgs = {
  userId: ID | null | undefined
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
  pageSize?: number
}

export const usePurchases = (
  args: GetPurchaseListArgs,
  options?: QueryOptions
) => {
  const { userId, sortMethod, sortDirection, pageSize = PAGE_SIZE } = args
  const { audiusSdk } = useAudiusQueryContext()
  const queryResult = useInfiniteQuery({
    queryKey: [QUERY_KEYS.purchases, args],
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: USDCPurchaseDetails[],
      allPages: USDCPurchaseDetails[][]
    ) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getPurchases({
        id: Id.parse(userId),
        userId: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        sortDirection,
        sortMethod
      })

      return data.map(purchaseFromSDK)
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })

  const pages = queryResult.data?.pages
  const lastPage = pages?.[pages.length - 1]
  const userIdsToFetch = lastPage?.map(({ buyerUserId }) => buyerUserId)
  const trackIdsToFetch = lastPage
    ?.filter(({ contentType }) => contentType === USDCContentPurchaseType.TRACK)
    .map(({ contentId }) => contentId)
  const collectionIdsToFetch = lastPage
    ?.filter(({ contentType }) => contentType === USDCContentPurchaseType.ALBUM)
    .map(({ contentId }) => contentId)

  // Call the hooks dropping results to pre-fetch the data
  useUsers(userIdsToFetch)
  useTracks(trackIdsToFetch)
  useCollections(collectionIdsToFetch)

  return { ...queryResult, data: queryResult.data?.pages.flat() }
}
