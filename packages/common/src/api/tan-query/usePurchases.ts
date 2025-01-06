import { full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { Id } from '~/api/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '~/models/USDCTransactions'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { makeTracksQueryFn } from './useTracks'
import { parsePurchase } from './utils/parsePurchase'

export type GetPurchaseListArgs = {
  userId: Nullable<ID>
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
}

export type PaginatedPurchaseListArgs = GetPurchaseListArgs & {
  limit: number
  offset: number
}

export const usePurchases = (
  args: GetPurchaseListArgs,
  options: { pageSize: number; enabled?: boolean }
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { pageSize, enabled } = options
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const queryResult = useInfiniteQuery({
    queryKey: [QUERY_KEYS.purchases, args],
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
        id: Id.parse(args.userId!),
        userId: Id.parse(args.userId!)
      })
      const purchases = data.map(parsePurchase)

      // Pre-fetch track metadata
      const trackIdsToFetch = purchases
        .filter(
          ({ contentType }) => contentType === USDCContentPurchaseType.TRACK
        )
        .map(({ contentId }) => contentId)
      if (trackIdsToFetch.length > 0) {
        await makeTracksQueryFn(
          queryClient,
          dispatch,
          audiusSdk()
        )(trackIdsToFetch)
      }
      // TODO: [PAY-2548] Purchaseable Albums - fetch metadata for albums
      return purchases
    }
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } =
    queryResult

  // Flatten pages into a single array
  const flatData = data?.pages.flat() ?? []

  return {
    data: flatData,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    ...rest
  }
}
