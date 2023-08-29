import { full } from '@audius/sdk'

import { createApi } from 'audius-query'
import { ID, Kind } from 'models'
import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from 'models/USDCTransactions'
import { StringUSDC } from 'models/Wallet'
import { encodeHashId } from 'utils/hashIds'
import { Nullable } from 'utils/typeUtils'

type GetPurchasesArgs = {
  userId: Nullable<ID>
  offset: number
  limit: number
  sortMethod?: full.GetPurchasesSortMethodEnum
  sortDirection?: full.GetPurchasesSortDirectionEnum
}

const parsePurchase = (purchase: full.Purchase): USDCPurchaseDetails => {
  const { contentId, contentType, amount, buyerUserId, sellerUserId, ...rest } =
    purchase
  return {
    ...rest,
    contentType: contentType as USDCContentPurchaseType,
    contentId: Number.parseInt(contentId),
    amount: amount as StringUSDC,
    buyerUserId: Number.parseInt(buyerUserId),
    sellerUserId: Number.parseInt(sellerUserId)
  }
}

const userApi = createApi({
  reducerPath: 'userApi',
  endpoints: {
    getUserById: {
      fetch: async (
        { id, currentUserId }: { id: ID; currentUserId: ID },
        { apiClient }
      ) => {
        const apiUser = await apiClient.getUser({ userId: id, currentUserId })
        return apiUser?.[0]
      },
      options: {
        idArgKey: 'id',
        kind: Kind.USERS,
        schemaKey: 'user'
      }
    },
    getPurchases: {
      fetch: async (
        { offset, limit, userId, sortDirection, sortMethod }: GetPurchasesArgs,
        { audiusSdk, audiusBackend }
      ) => {
        const { data: encodedDataMessage, signature: encodedDataSignature } =
          await audiusBackend.signDiscoveryNodeRequest()
        const sdk = await audiusSdk()
        const { data: purchases = [] } = await sdk.full.users.getPurchases({
          limit,
          offset,
          sortDirection,
          sortMethod,
          id: encodeHashId(userId!),
          userId: encodeHashId(userId!),
          encodedDataMessage,
          encodedDataSignature
        })
        return purchases.map(parsePurchase)
      },
      options: {}
    }
  }
})

export const { useGetUserById, useGetPurchases } = userApi.hooks
export const userApiReducer = userApi.reducer
