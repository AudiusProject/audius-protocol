import { useMemo } from 'react'

import { full } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

import { purchaseFromSDK } from '~/adapters/purchase'
import { Id } from '~/api/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '~/models/USDCTransactions'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { useCollections } from './useCollections'
import { useTracks } from './useTracks'
import { useUsers } from './useUsers'

export type GetPurchaseListArgs = {
  userId: Nullable<ID>
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
}

export const usePurchases = (
  args: GetPurchaseListArgs,
  options: { pageSize: number; enabled?: boolean }
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { pageSize, enabled } = options
  const queryResult = useInfiniteQuery({
    queryKey: [
      QUERY_KEYS.purchases,
      args.userId,
      args.sortMethod,
      args.sortDirection
    ],
    enabled: enabled !== false && !!args.userId,
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
        limit: pageSize,
        offset: pageParam,
        sortDirection: args.sortDirection,
        sortMethod: args.sortMethod,
        id: Id.parse(args.userId),
        userId: Id.parse(args.userId)
      })

      return data.map(purchaseFromSDK)
    }
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } =
    queryResult

  const { flatData, userIdsToFetch, trackIdsToFetch, collectionIdsToFetch } =
    useMemo(() => {
      const flatData = data?.pages.flat() ?? []
      return {
        flatData,
        userIdsToFetch: flatData.map(({ buyerUserId }) => buyerUserId),
        trackIdsToFetch: flatData
          .filter(
            ({ contentType }) => contentType === USDCContentPurchaseType.TRACK
          )
          .map(({ contentId }) => contentId),
        collectionIdsToFetch: flatData
          .filter(
            ({ contentType }) => contentType === USDCContentPurchaseType.ALBUM
          )
          .map(({ contentId }) => contentId)
      }
    }, [data?.pages])

  // Call the hooks dropping results to pre-fetch the data
  useUsers(userIdsToFetch)
  useTracks(trackIdsToFetch)
  useCollections(collectionIdsToFetch)
  return {
    data: flatData,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    ...rest
  }
}
