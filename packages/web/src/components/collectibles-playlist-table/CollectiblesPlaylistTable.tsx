import { useCallback, useMemo, MouseEvent } from 'react'

import { Chain } from '@audius/common/models'
import { formatSeconds } from '@audius/common/utils'
import cn from 'classnames'
import { Cell, Row } from 'react-table'

import { Table, TablePlayButton } from 'components/table'

import styles from './CollectiblesPlaylistTable.module.css'

type CollectibleInfo = {
  name: string
  duration: number
  chain: Chain
}

type CollectibleCell = Cell<CollectibleInfo>
type CollectibleRow = Row<CollectibleInfo>

const chainLabelMap: Record<Chain, string> = {
  [Chain.Eth]: 'Ethereum',
  [Chain.Sol]: 'Solana'
}

export type CollectiblesPlaylistTableColumn =
  | 'chain'
  | 'collectibleName'
  | 'length'
  | 'playButton'
  | 'spacer'

type CollectiblesPlaylistTableProps = {
  columns?: CollectiblesPlaylistTableColumn[]
  data: any[]
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (collectible: any, index: number) => void
  onClickTrackName?: (collectible: any) => void
  playing?: boolean
  playingIndex?: number
  tableClassName?: string
  wrapperClassName?: string
}

const defaultColumns: CollectiblesPlaylistTableColumn[] = [
  'playButton',
  'collectibleName',
  'chain',
  'length',
  'spacer'
]

export const CollectiblesPlaylistTable = ({
  columns = defaultColumns,
  data,
  isVirtualized = false,
  loading = false,
  onClickRow,
  onClickTrackName: onClickCollectibleName,
  playing = false,
  playingIndex = -1,
  tableClassName,
  wrapperClassName
}: CollectiblesPlaylistTableProps) => {
  // Cell Render Functions
  const renderPlayButtonCell = useCallback(
    (cellInfo: CollectibleCell) => {
      const index = cellInfo.row.index
      const active = index === playingIndex
      return (
        <TablePlayButton
          className={cn(styles.tablePlayButton, { [styles.active]: active })}
          paused={!playing}
          playing={active}
          hideDefault={false}
        />
      )
    },
    [playing, playingIndex]
  )

  const renderCollectibleNameCell = useCallback(
    (cellInfo: CollectibleCell) => {
      const collectible = cellInfo.row.original
      const index = cellInfo.row.index
      return (
        <div
          className={styles.textContainer}
          onClick={(e) => {
            e.stopPropagation()
            onClickCollectibleName?.(collectible)
          }}
        >
          <div
            className={cn(styles.textCell, styles.collectibleName, {
              [styles.isPlaying]: index === playingIndex
            })}
          >
            {collectible.name}
          </div>
        </div>
      )
    },
    [onClickCollectibleName, playingIndex]
  )

  const renderLengthCell = useCallback((cellInfo: CollectibleCell) => {
    const collectible = cellInfo.row.original
    return formatSeconds(collectible.duration)
  }, [])

  const renderChainCell = useCallback((cellInfo: CollectibleCell) => {
    const collectible = cellInfo.row.original
    return chainLabelMap[collectible.chain as Chain]
  }, [])

  // Columns
  const tableColumnMap = useMemo(
    () => ({
      playButton: {
        id: 'playButton',
        Cell: renderPlayButtonCell,
        minWidth: 48,
        maxWidth: 48,
        disableResizing: true,
        disableSortBy: true
      },
      collectibleName: {
        id: 'collectibleName',
        Header: 'Track Name',
        accessor: 'title',
        Cell: renderCollectibleNameCell,
        maxWidth: 600,
        width: 400,
        disableSortBy: true,
        align: 'left'
      },
      length: {
        id: 'duration',
        Header: 'Length',
        accessor: 'duration',
        Cell: renderLengthCell,
        maxWidth: 160,
        disableSortBy: true,
        align: 'right'
      },
      chain: {
        id: 'chain',
        Header: 'Chain',
        accessor: 'chain',
        Cell: renderChainCell,
        maxWidth: 160,
        disableSortBy: true,
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
      renderPlayButtonCell,
      renderCollectibleNameCell,
      renderLengthCell,
      renderChainCell
    ]
  )

  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns, tableColumnMap]
  )

  const handleClickRow = useCallback(
    (
      _e: MouseEvent<HTMLTableRowElement>,
      rowInfo: CollectibleRow,
      index: number
    ) => {
      const collectible = rowInfo.original
      onClickRow?.(collectible, index)
    },
    [onClickRow]
  )

  const getRowClassName = useCallback(() => styles.tableRow, [])

  return (
    <Table
      wrapperClassName={wrapperClassName}
      tableClassName={tableClassName}
      getRowClassName={getRowClassName}
      columns={tableColumns}
      data={data}
      loading={loading}
      onClickRow={handleClickRow}
      activeIndex={playingIndex}
      isVirtualized={isVirtualized}
    />
  )
}
