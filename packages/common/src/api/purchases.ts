import type { full } from '@audius/sdk'
import { HashId, Id } from '@audius/sdk'

import { createApi } from '~/audius-query'
import { ID, PurchaseAccess } from '~/models'
import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '~/models/USDCTransactions'
import { StringUSDC } from '~/models/Wallet'
import { Nullable } from '~/utils/typeUtils'

import { trackApiFetch } from './track'
import { userApiFetch } from './user'

type GetPurchaseListArgs = {
  userId: Nullable<ID>
  offset: number
  limit: number
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
}

const parsePurchase = (purchase: full.Purchase): USDCPurchaseDetails => {
  const {
    contentId,
    contentType,
    extraAmount,
    amount,
    buyerUserId,
    sellerUserId,
    access,
    ...rest
  } = purchase
  return {
    ...rest,
    contentType: contentType as USDCContentPurchaseType,
    contentId: HashId.parse(contentId),
    amount: amount as StringUSDC,
    extraAmount: extraAmount as StringUSDC,
    buyerUserId: HashId.parse(buyerUserId),
    sellerUserId: HashId.parse(sellerUserId),
    access: access as PurchaseAccess
  }
}

const purchasesApi = createApi({
  reducerPath: 'purchasesApi',
  endpoints: {
    getPurchases: {
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
        const { data = [] } = await sdk.full.users.getPurchases({
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
        // TODO: [PAY-2548] Purchaseable Albums - fetch metadata for albums
        return purchases
      },
      options: { retry: true }
    },
    getPurchasesCount: {
      fetch: async (
        { userId }: Pick<GetPurchaseListArgs, 'userId'>,
        { audiusSdk }
      ) => {
        const sdk = await audiusSdk()
        const { data } = await sdk.full.users.getPurchasesCount({
          id: Id.parse(userId!),
          userId: Id.parse(userId!)
        })
        return data ?? 0
      },
      options: { retry: true }
    },
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

export const {
  useGetPurchases,
  useGetPurchasesCount,
  useGetSales,
  useGetSalesCount
} = purchasesApi.hooks
export const purchasesApiReducer = purchasesApi.reducer
export const purchasesApiActions = purchasesApi.actions
