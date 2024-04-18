import { MouseEvent, useCallback, useMemo, useRef } from 'react'

import {
  CollectionMetadata,
  UserCollectionMetadata
} from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import cn from 'classnames'
import moment from 'moment'
import { Cell, Row } from 'react-table'

import { TextLink } from 'components/link'
import {
  Table,
  // OverflowMenuButton,
  alphaSorter,
  dateSorter,
  numericSorter
} from 'components/table'

import styles from './CollectionsTable.css'
import { CollectionsTableOverflowMenuButton } from './CollectionsTableOverflowMenuButton'

type RowInfo = UserCollectionMetadata & {
  name: string
  artist: string
  date: string
  dateSaved: string
  dateAdded: string
}

type CollectionCell = Cell<RowInfo>

type CollectionRow = Row<RowInfo>

export type CollectionsTableColumn =
  | 'playlistName'
  | 'overflowMenu'
  | 'releaseDate'
  | 'reposts'
  | 'saves'
  | 'spacer'

type CollectionsTableProps = {
  columns?: CollectionsTableColumn[]
  data: any[]
  isVirtualized?: boolean
  loading?: boolean
  defaultSorter?: (a: any, b: any) => number
  fetchMore?: (offset: number, limit: number) => void
  fetchBatchSize?: number
  onClickRow?: (playlist: CollectionMetadata, index: number) => void
  // onShowMoreToggle?: (setting: boolean) => void
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  showMoreLimit?: number
  totalRowCount?: number
}

const defaultColumns: CollectionsTableColumn[] = [
  'playlistName',
  'overflowMenu',
  'releaseDate',
  'reposts',
  'saves',
  'spacer'
]

export const CollectionsTable = ({
  columns = defaultColumns,
  data,
  defaultSorter,
  fetchBatchSize,
  fetchMore,
  isVirtualized = false,
  loading = false,
  onClickRow,
  // onShowMoreToggle,
  scrollRef,
  showMoreLimit,
  totalRowCount
}: CollectionsTableProps) => {
  // Cell Render Functions
  const renderPlaylistNameCell = useCallback((cellInfo: CollectionCell) => {
    const playlist = cellInfo.row.original
    const deleted = playlist.is_delete || !!playlist.user?.is_deactivated

    return (
      <div className={styles.textContainer} css={{ overflow: 'hidden' }}>
        <TextLink
          tag={deleted ? 'span' : undefined}
          to={deleted ? '' : playlist.permalink ?? ''}
          textVariant='title'
          size='s'
          strength='weak'
          css={{ display: 'block' }}
          ellipses
        >
          {playlist.playlist_name}
          {deleted ? ` [Deleted By Artist]` : ''}
        </TextLink>
      </div>
    )
  }, [])

  const renderRepostsCell = useCallback((cellInfo: CollectionCell) => {
    const playlist = cellInfo.row.original
    return formatCount(playlist.repost_count)
  }, [])

  const renderSavesCell = useCallback((cellInfo: CollectionCell) => {
    const playlist = cellInfo.row.original
    return playlist.save_count
  }, [])

  const renderReleaseDateCell = useCallback((cellInfo: CollectionCell) => {
    const playlist = cellInfo.row.original
    let suffix = ''
    if (
      playlist.release_date &&
      moment(playlist.release_date).isAfter(moment.now())
    ) {
      suffix = ' (Scheduled)'
    }
    return (
      moment(playlist.release_date ?? playlist.created_at).format('M/D/YY') +
      suffix
    )
  }, [])

  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const renderOverflowMenuCell = useCallback((cellInfo: CollectionCell) => {
    const playlist = cellInfo.row.original
    return (
      <div ref={overflowMenuRef}>
        <CollectionsTableOverflowMenuButton
          className={styles.tableActionButton}
          includeFavorite={false}
          collectionId={playlist.playlist_id}
          // uid={playlist.uid}
          date={playlist.date}
          index={cellInfo.row.index}
        />
      </div>
    )
  }, [])

  // Columns
  const tableColumnMap = useMemo(
    () => ({
      releaseDate: {
        id: 'dateReleased',
        Header: 'Released',
        accessor: 'created_at',
        Cell: renderReleaseDateCell,
        maxWidth: 160,
        sortTitle: 'Date Released',
        sorter: dateSorter('created_at'),
        align: 'right'
      },
      reposts: {
        id: 'reposts',
        Header: 'Reposts',
        accessor: 'repost_count',
        Cell: renderRepostsCell,
        maxWidth: 160,
        sortTitle: 'Reposts',
        sorter: numericSorter('repost_count'),
        align: 'right'
      },
      saves: {
        id: 'saves',
        Header: 'Favorites',
        accessor: 'save_count',
        Cell: renderSavesCell,
        maxWidth: 160,
        sortTitle: 'Favorites',
        sorter: numericSorter('save_count'),
        align: 'right'
      },
      overflowMenu: {
        id: 'overflowMenu',
        Cell: renderOverflowMenuCell,
        minWidth: 64,
        maxWidth: 64,
        width: 64,
        disableResizing: true,
        disableSortBy: true
      },
      playlistName: {
        id: 'playlistName',
        Header: 'Album Name',
        accessor: 'title',
        Cell: renderPlaylistNameCell,
        maxWidth: 300,
        width: 120,
        sortTitle: 'Album Name',
        sorter: alphaSorter('title'),
        align: 'left'
      },
      spacer: {
        id: 'spacer',
        maxWidth: 24,
        minWidth: 24,
        disableSortBy: true,
        disableResizing: true
      }
    }),
    [
      renderReleaseDateCell,
      renderRepostsCell,
      renderSavesCell,
      renderOverflowMenuCell,
      renderPlaylistNameCell
    ]
  )

  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns, tableColumnMap]
  )

  const handleClickRow = useCallback(
    (
      e: MouseEvent<HTMLTableRowElement>,
      rowInfo: CollectionRow,
      index: number
    ) => {
      const playlist = rowInfo.original
      onClickRow?.(playlist, index)
    },
    [onClickRow]
  )

  const getRowClassName = useCallback(
    (rowIndex: number) => {
      const playlist = data[rowIndex]
      const deleted = playlist.is_delete || !!playlist.user?.is_deactivated
      return cn(styles.tableRow, {
        [styles.disabled]: deleted
      })
    },
    [data]
  )

  return (
    <Table
      columns={tableColumns}
      data={data}
      defaultSorter={defaultSorter}
      fetchBatchSize={fetchBatchSize}
      fetchMore={fetchMore}
      getRowClassName={getRowClassName}
      isTracksTable
      isVirtualized={isVirtualized}
      loading={loading}
      onClickRow={handleClickRow}
      // onShowMoreToggle={onShowMoreToggle}
      scrollRef={scrollRef}
      showMoreLimit={showMoreLimit}
      totalRowCount={totalRowCount}
    />
  )
}
