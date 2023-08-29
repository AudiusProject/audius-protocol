import { PurchaseRow } from './types'

export const isEmptyPurchaseRow = (row?: PurchaseRow) => {
  return !row?.original.signature
}
