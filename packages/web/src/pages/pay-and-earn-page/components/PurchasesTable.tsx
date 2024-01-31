import { MouseEvent, useCallback, useMemo } from 'react'

import {
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '@audius/common/models'
import { formatUSDCWeiToUSDString } from '@audius/common/utils'
import BN from 'bn.js'
import moment from 'moment'

import { Table } from 'components/table'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

import { PurchaseCell, PurchaseRow } from '../types'
import { isEmptyPurchaseRow } from '../utils'

import { TrackNameWithArtwork } from './TrackNameWithArtwork'

export type PurchasesTableColumn =
  | 'contentName'
  | 'artist'
  | 'date'
  | 'value'
  | 'spacerLeft'
  | 'spacerRight'

export type PurchasesTableSortMethod =
  | 'contentId'
  | 'sellerUserId'
  | 'createdAt'
export type PurchasesTableSortDirection = 'asc' | 'desc'

type PurchasesTableProps = {
  columns?: PurchasesTableColumn[]
  data: USDCPurchaseDetails[]
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (txDetails: USDCPurchaseDetails, index: number) => void
  onSort: (
    sortMethod: PurchasesTableSortMethod,
    sortDirection: PurchasesTableSortDirection
  ) => void
  fetchMore: (offset: number, limit: number) => void
  totalRowCount?: number
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  fetchBatchSize: number
}

const defaultColumns: PurchasesTableColumn[] = [
  'spacerLeft',
  'contentName',
  'artist',
  'date',
  'value',
  'spacerRight'
]

// Cell Render Functions
const renderContentNameCell = (cellInfo: PurchaseCell) => {
  const { contentId, contentType } = cellInfo.row.original
  return contentType === USDCContentPurchaseType.TRACK ? (
    <TrackNameWithArtwork id={contentId} />
  ) : (
    // TODO: When we support collection purchases
    <div />
  )
}

const renderArtistCell = (cellInfo: PurchaseCell) => {
  const { sellerUserId } = cellInfo.row.original
  return <UserNameAndBadges userId={sellerUserId} />
}

const renderDateCell = (cellInfo: PurchaseCell) => {
  const transaction = cellInfo.row.original
  return moment(transaction.createdAt).format('M/D/YY')
}

const renderValueCell = (cellInfo: PurchaseCell) => {
  const transaction = cellInfo.row.original
  const total = new BN(transaction.amount).add(new BN(transaction.extraAmount))
  return `$${formatUSDCWeiToUSDString(total)}`
}

// Columns
const tableColumnMap = {
  contentName: {
    id: 'contentName',
    Header: 'Purchases',
    accessor: 'contentId',
    Cell: renderContentNameCell,
    width: 480,
    disableSortBy: false,
    align: 'left'
  },
  artist: {
    id: 'artist',
    Header: 'Artist',
    accessor: 'sellerUserId',
    Cell: renderArtistCell,
    maxWidth: 200,
    disableSortBy: false,
    align: 'left'
  },
  date: {
    id: 'date',
    Header: 'Date',
    accessor: 'createdAt',
    Cell: renderDateCell,
    maxWidth: 150,
    disableSortBy: false,
    align: 'right'
  },
  value: {
    id: 'value',
    Header: 'Value',
    accessor: 'amount',
    Cell: renderValueCell,
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

/** Renders a table of `USDCPurchaseDetails` records with details intended for the Buyer */
export const PurchasesTable = ({
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
}: PurchasesTableProps) => {
  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns]
  )

  const handleClickRow = useCallback(
    (
      _: MouseEvent<HTMLTableRowElement>,
      rowInfo: PurchaseRow,
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
      isEmptyRow={isEmptyPurchaseRow}
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
