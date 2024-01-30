import { MouseEvent, useCallback, useMemo } from 'react'

import { formatUSDCWeiToUSDString } from '@audius/common'
import { USDCTransactionDetails } from '@audius/common/models'
import moment from 'moment'

import { Table } from 'components/table'

import { TransactionCell, TransactionRow } from '../types'
import { isEmptyTransactionRow } from '../utils'

import styles from './WithdrawalsTable.module.css'

export type WithdrawalsTableColumn =
  | 'destination'
  | 'date'
  | 'amount'
  | 'spacerLeft'
  | 'spacerRight'

export type WithdrawalsTableSortMethod = 'date'
export type WithdrawalsTableSortDirection = 'asc' | 'desc'

type WithdrawalsTableProps = {
  columns?: WithdrawalsTableColumn[]
  data: USDCTransactionDetails[]
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (txDetails: USDCTransactionDetails, index: number) => void
  onSort: (
    sortMethod: WithdrawalsTableSortMethod,
    sortDirection: WithdrawalsTableSortDirection
  ) => void
  fetchMore: (offset: number, limit: number) => void
  totalRowCount?: number
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  fetchBatchSize: number
}

const defaultColumns: WithdrawalsTableColumn[] = [
  'spacerLeft',
  'destination',
  'date',
  'amount',
  'spacerRight'
]

// Cell Render Functions
const renderDestinationCell = (cellInfo: TransactionCell) => {
  const { metadata } = cellInfo.row.original
  return typeof metadata === 'string' ? (
    <span className={styles.text}>{metadata}</span>
  ) : (
    ''
  )
}

const renderDateCell = (cellInfo: TransactionCell) => {
  const transaction = cellInfo.row.original
  return moment(transaction.transactionDate).format('M/D/YY')
}

const renderAmountCell = (cellInfo: TransactionCell) => {
  const transaction = cellInfo.row.original
  return `-$${formatUSDCWeiToUSDString(transaction.change)}`
}

// Columns
const tableColumnMap = {
  destination: {
    id: 'destination',
    Header: 'Wallet',
    accessor: 'metadata',
    Cell: renderDestinationCell,
    width: 480,
    disableSortBy: false,
    align: 'left'
  },
  date: {
    id: 'date',
    Header: 'Date',
    accessor: 'date',
    Cell: renderDateCell,
    maxWidth: 150,
    disableSortBy: false,
    align: 'right'
  },
  amount: {
    id: 'amount',
    Header: 'Amount',
    accessor: 'amount',
    Cell: renderAmountCell,
    maxWidth: 200,
    disableSortBy: true,
    align: 'right'
  },
  spacerLeft: {
    id: 'spacerLeft',
    maxWidth: 24,
    minWidth: 24,
    disableSortBy: true,
    disableResizing: true
  },
  spacerRight: {
    id: 'spacerRight',
    maxWidth: 24,
    minWidth: 24,
    disableSortBy: true,
    disableResizing: true
  }
}

/** Renders a table of `USDCTransactionDetails` records */
export const WithdrawalsTable = ({
  columns = defaultColumns,
  data,
  isVirtualized = false,
  loading = false,
  onClickRow,
  onSort,
  fetchMore,
  totalRowCount,
  scrollRef,
  fetchBatchSize
}: WithdrawalsTableProps) => {
  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns]
  )

  const handleClickRow = useCallback(
    (
      _: MouseEvent<HTMLTableRowElement>,
      rowInfo: TransactionRow,
      index: number
    ) => {
      onClickRow?.(rowInfo.original, index)
    },
    [onClickRow]
  )

  return (
    <Table
      columns={tableColumns}
      data={data}
      loading={loading}
      isEmptyRow={isEmptyTransactionRow}
      onClickRow={handleClickRow}
      onSort={onSort}
      fetchMore={fetchMore}
      isVirtualized={isVirtualized}
      totalRowCount={totalRowCount ?? 0}
      scrollRef={scrollRef}
      fetchBatchSize={fetchBatchSize}
    />
  )
}
