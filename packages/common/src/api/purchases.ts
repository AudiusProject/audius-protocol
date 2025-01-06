import type { full } from '@audius/sdk'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { USDCContentPurchaseType } from '~/models/USDCTransactions'
import { Nullable } from '~/utils/typeUtils'

import { parsePurchase } from './tan-query/utils/parsePurchase'
import { trackApiFetch } from './track'
import { userApiFetch } from './user'
import { Id } from './utils'

type GetPurchaseListArgs = {
  userId: Nullable<ID>
  offset: number
  limit: number
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
}

const purchasesApi = createApi({
  reducerPath: 'purchasesApi',
  endpoints: {
    getSales: {
      fetch: async (
        {
          offset,
          limit,
          userId,
          sortDirection,
          sortMethod
        }: GetPurchaseListArgs,
        context
      ) => {
        const sdk = await context.audiusSdk()
        const { data = [] } = await sdk.full.users.getSales({
          limit,
          offset,
          sortDirection,
          sortMethod,
          id: Id.parse(userId!),
          userId: Id.parse(userId!)
        })

        const purchases = data.map(parsePurchase)

        // Pre-fetch track metadata
        const trackIdsToFetch = purchases
          .filter(
            ({ contentType }) => contentType === USDCContentPurchaseType.TRACK
          )
          .map(({ contentId }) => contentId)
        if (trackIdsToFetch.length > 0) {
          await trackApiFetch.getTracksByIds(
            { ids: trackIdsToFetch, currentUserId: userId },
            context
          )
        }
        // fetch buyer metadata
        const userIdsToFetch = purchases.map(({ buyerUserId }) => buyerUserId)
        if (userIdsToFetch.length > 0) {
          await userApiFetch.getUsersByIds({ ids: userIdsToFetch }, context)
        }

        // TODO: [PAY-2548] Purchaseable Albums - fetch metadata for albums
        return purchases
      },
      options: { retry: true }
    },
    getSalesCount: {
      fetch: async (
        { userId }: Pick<GetPurchaseListArgs, 'userId'>,
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getSalesCount({
          id: Id.parse(userId!),
          userId: Id.parse(userId!)
        })
        return data ?? 0
      },
      options: { retry: true }
    }
  }
})

export const { useGetSales, useGetSalesCount } = purchasesApi.hooks
export const purchasesApiReducer = purchasesApi.reducer
export const purchasesApiActions = purchasesApi.actions
