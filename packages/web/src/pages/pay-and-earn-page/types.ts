import {
  USDCPurchaseDetails,
  USDCTransactionDetails
} from '@audius/common/models'
import { Cell, Row } from 'react-table'

export enum TableType {
  SALES = 'sales',
  PURCHASES = 'purchases',
  WITHDRAWALS = 'withdrawals'
}

export type PayAndEarnPageProps = { tableView: TableType }

export type PurchaseCell = Cell<USDCPurchaseDetails>
export type PurchaseRow = Row<USDCPurchaseDetails>
export type TransactionCell = Cell<USDCTransactionDetails>
export type TransactionRow = Row<USDCTransactionDetails>
