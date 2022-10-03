import { useCallback, useMemo } from 'react'

import {
  formatNumberCommas,
  TransactionMethod,
  TransactionType
} from '@audius/common'
import cn from 'classnames'
import moment from 'moment'
import { ColumnInstance } from 'react-table'

import { AudioTransactionIcon } from 'components/audio-transaction-icon'
import { TestTable } from 'components/test-table'

import styles from './AudioTransactionsTable.module.css'

const transactionTypeLabelMap: Record<TransactionType, string> = {
  [TransactionType.TRANSFER]: '$AUDIO',
  [TransactionType.CHALLENGE_REWARD]: '$AUDIO Reward Earned',
  [TransactionType.TRENDING_REWARD]: 'Trending Competition Award',
  [TransactionType.TIP]: 'Tip',
  [TransactionType.PURCHASE]: 'Purchased $AUDIO'
}

const transactionMethodLabelMap: Record<TransactionMethod, string | null> = {
  [TransactionMethod.COINBASE]: null,
  [TransactionMethod.STRIPE]: null,
  [TransactionMethod.RECEIVE]: 'Received',
  [TransactionMethod.SEND]: 'Sent'
}

export type AudioTransactionsTableColumn =
  | 'balance'
  | 'change'
  | 'date'
  | 'transactionIcon'
  | 'transactionType'
  | 'spacer'
  | 'spacer2'

type AudioTransactionsTableProps = {
  columns?: AudioTransactionsTableColumn[]
  data: any[]
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (collectible: any, index: number) => void
  tableClassName?: string
  wrapperClassName?: string
}

const defaultColumns: AudioTransactionsTableColumn[] = [
  'spacer',
  'transactionIcon',
  'transactionType',
  'date',
  'change',
  'balance',
  'spacer2'
]

export const AudioTransactionsTable = ({
  columns = defaultColumns,
  data,
  isVirtualized = false,
  loading = false,
  onClickRow,
  tableClassName,
  wrapperClassName
}: AudioTransactionsTableProps) => {
  // Cell Render Functions
  const renderTransactionIconCell = useCallback((cellInfo) => {
    const { transactionType, method } = cellInfo.row.original
    return <AudioTransactionIcon type={transactionType} method={method} />
  }, [])

  const renderTransactionTypeCell = useCallback((cellInfo) => {
    const { transactionType, method } = cellInfo.row.original
    const typeText = transactionTypeLabelMap[transactionType as TransactionType]
    const methodText =
      transactionMethodLabelMap[method as TransactionMethod] ?? ''

    const isTransferType =
      transactionType === TransactionType.TIP ||
      transactionType === TransactionType.TRANSFER

    return `${typeText} ${isTransferType ? methodText : ''}`.trim()
  }, [])

  const renderBalanceCell = useCallback((cellInfo) => {
    const transaction = cellInfo.row.original
    return formatNumberCommas(transaction.balance)
  }, [])

  const renderDateCell = useCallback((cellInfo) => {
    const transaction = cellInfo.row.original
    return moment(transaction.date).format('M/D/YY')
  }, [])

  const renderChangeCell = useCallback((cellInfo) => {
    const { change } = cellInfo.row.original
    return (
      <div
        className={cn(styles.changeCell, {
          [styles.increase]: Number(change) > 0,
          [styles.decrease]: Number(change) < 0
        })}
      >
        {Number(change) > 0 ? '+' : ''}
        {change}
      </div>
    )
  }, [])

  // Columns
  const tableColumnMap: Record<
    AudioTransactionsTableColumn,
    Partial<ColumnInstance>
  > = useMemo(
    () => ({
      transactionIcon: {
        id: 'transactionIcon',
        accessor: '',
        Cell: renderTransactionIconCell,
        minWidth: 64,
        maxWidth: 64,
        disableResizing: true,
        disableSortBy: true
      },
      transactionType: {
        id: 'transactionType',
        Header: 'Transaction Type',
        accessor: 'type',
        Cell: renderTransactionTypeCell,
        width: 150,
        disableSortBy: true,
        align: 'left'
      },
      date: {
        id: 'date',
        Header: 'Date',
        accessor: 'date',
        Cell: renderDateCell,
        disableSortBy: true,
        align: 'right'
      },
      change: {
        id: 'change',
        Header: 'Change',
        accessor: 'change',
        Cell: renderChangeCell,
        disableSortBy: true,
        align: 'right'
      },
      balance: {
        id: 'balance',
        Header: 'Balance',
        accessor: 'balance',
        Cell: renderBalanceCell,
        disableSortBy: true,
        align: 'right'
      },
      spacer: {
        id: 'spacer',
        maxWidth: 24,
        minWidth: 24,
        disableSortBy: true,
        disableResizing: true
      },
      spacer2: {
        id: 'spacer2',
        maxWidth: 24,
        minWidth: 24,
        disableSortBy: true,
        disableResizing: true
      }
    }),
    [
      renderTransactionIconCell,
      renderTransactionTypeCell,
      renderDateCell,
      renderChangeCell,
      renderBalanceCell
    ]
  )

  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns, tableColumnMap]
  )

  const handleClickRow = useCallback(
    (rowInfo, index: number) => {
      const transaction = rowInfo.original
      onClickRow?.(transaction, index)
    },
    [onClickRow]
  )

  const getRowClassName = useCallback(() => '', [])

  return (
    <TestTable
      wrapperClassName={wrapperClassName}
      tableClassName={tableClassName}
      getRowClassName={getRowClassName}
      columns={tableColumns}
      data={data}
      loading={loading}
      onClickRow={handleClickRow}
      isVirtualized={isVirtualized}
    />
  )
}
