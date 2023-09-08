import { PurchaseRow, TransactionRow } from './types'

export const isEmptyPurchaseRow = (row?: PurchaseRow) => {
  return !row?.original.signature
}

export const isEmptyTransactionRow = (row?: TransactionRow) => {
  return !row?.original.signature
}
