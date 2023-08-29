import { MouseEvent, useCallback, useMemo } from 'react'

import {
  accountSelectors,
  formatUSDCWeiToUSDString,
  SquareSizes,
  statusIsNotFinalized,
  USDCContentPurchaseType,
  USDCPurchaseDetails,
  useGetTrackById,
  useGetUserById
} from '@audius/common'
import moment from 'moment'
import { Cell, Row } from 'react-table'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Table } from 'components/table'
import { Text } from 'components/typography'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { useSelector } from 'utils/reducer'

import styles from './PurchasesTable.module.css'

const { getUserId } = accountSelectors

type PurchaseCell = Cell<USDCPurchaseDetails>
type PurchaseRow = Row<USDCPurchaseDetails>

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

// TODO: When we support collection purchases
const CollectionNameCell = ({ id }: { id: number }) => {
  return <div />
}

const TrackNameCell = ({ id }: { id: number }) => {
  const { status, data: track } = useGetTrackById({ id })
  const image = useTrackCoverArt2(id, SquareSizes.SIZE_150_BY_150)
  const loading = statusIsNotFinalized(status) || !track
  return loading ? null : (
    <div className={styles.contentName}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      <Text variant='body' size='small'>
        {track.title}
      </Text>
    </div>
  )
}

const UserNameAndBadge = ({ userId }: { userId: number }) => {
  const currentUserId: number = useSelector(getUserId)!
  const { status, data: user } = useGetUserById({ id: userId, currentUserId })
  const loading = statusIsNotFinalized(status) || !user
  return loading ? null : (
    <div className={styles.artistName}>
      <Text variant='body' size='small' strength='strong'>
        {user.name}
      </Text>
      <UserBadges
        userId={userId}
        className={styles.badgeIcon}
        noContentClassName={styles.noContentBadgeIcon}
        badgeSize={12}
        useSVGTiers
      />
    </div>
  )
}

// Cell Render Functions
const renderContentNameCell = (cellInfo: PurchaseCell) => {
  const { contentId, contentType } = cellInfo.row.original
  return contentType === USDCContentPurchaseType.TRACK ? (
    <TrackNameCell id={contentId} />
  ) : (
    <CollectionNameCell id={contentId} />
  )
}

const renderArtistCell = (cellInfo: PurchaseCell) => {
  const { sellerUserId } = cellInfo.row.original
  return <UserNameAndBadge userId={sellerUserId} />
}

const renderDateCell = (cellInfo: PurchaseCell) => {
  const transaction = cellInfo.row.original
  return moment(transaction.createdAt).format('M/D/YY')
}

const renderValueCell = (cellInfo: PurchaseCell) => {
  const transaction = cellInfo.row.original
  return `$${formatUSDCWeiToUSDString(transaction.amount)}`
}

const isEmptyRow = (row?: PurchaseRow) => {
  return !row?.original.signature
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

/** Renders a table of `USDCPurchaseDetails` records */
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
      isEmptyRow={isEmptyRow}
      onClickRow={handleClickRow}
      onSort={onSort}
      fetchMore={fetchMore}
      isVirtualized={isVirtualized}
      totalRowCount={totalRowCount}
      scrollRef={scrollRef}
      fetchBatchSize={fetchBatchSize}
    />
  )
}
