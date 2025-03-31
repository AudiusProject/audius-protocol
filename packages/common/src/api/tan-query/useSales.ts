import { useMemo } from 'react'

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

export type GetSalesListArgs = {
  userId: ID | null | undefined
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
  pageSize?: number
}

export const getSalesQueryKey = ({
  userId,
  sortMethod,
  sortDirection,
  pageSize = PAGE_SIZE
}: GetSalesListArgs) => [
  QUERY_KEYS.sales,
  userId,
  { sortMethod, sortDirection, pageSize }
]

export const useSales = (args: GetSalesListArgs, options?: QueryOptions) => {
  const { userId, sortMethod, sortDirection, pageSize = PAGE_SIZE } = args
  const context = useAudiusQueryContext()
  const { audiusSdk } = context

  const queryResult = useInfiniteQuery({
    queryKey: getSalesQueryKey({ userId, sortMethod, sortDirection, pageSize }),
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
      const { data = [] } = await sdk.full.users.getSales({
        id: Id.parse(userId!),
        userId: Id.parse(userId!),
        limit: pageSize,
        offset: pageParam,
        sortDirection,
        sortMethod
      })
      return data.map(purchaseFromSDK)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!args.userId
  })

  const { userIdsToFetch, trackIdsToFetch, collectionIdsToFetch } = useMemo(
    () => ({
      userIdsToFetch: queryResult.data?.map(({ buyerUserId }) => buyerUserId),
      trackIdsToFetch: queryResult.data
        ?.filter(
          ({ contentType }) => contentType === USDCContentPurchaseType.TRACK
        )
        .map(({ contentId }) => contentId),
      collectionIdsToFetch: queryResult.data
        ?.filter(
          ({ contentType }) => contentType === USDCContentPurchaseType.ALBUM
        )
        .map(({ contentId }) => contentId)
    }),
    [queryResult.data]
  )

  // Call the hooks dropping results to pre-fetch the data
  useUsers(userIdsToFetch)
  useTracks(trackIdsToFetch)
  useCollections(collectionIdsToFetch)

  return queryResult
}
