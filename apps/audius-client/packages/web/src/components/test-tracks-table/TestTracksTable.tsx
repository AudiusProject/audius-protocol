import { useCallback, useMemo, useRef } from 'react'

import { formatCount, formatSeconds } from '@audius/common'
import cn from 'classnames'
import moment from 'moment'
import { ColumnInstance } from 'react-table'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import {
  TestTable,
  OverflowMenuButton,
  TableFavoriteButton,
  TablePlayButton,
  TableRepostButton,
  alphaSorter,
  dateSorter,
  numericSorter
} from 'components/test-table'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges/UserBadges'
import { isDescendantElementOf } from 'utils/domUtils'

import styles from './TestTracksTable.module.css'

export type TracksTableColumn =
  | 'addedDate'
  | 'artistName'
  | 'date'
  | 'length'
  | 'listenDate'
  | 'overflowActions'
  | 'playButton'
  | 'plays'
  | 'releaseDate'
  | 'reposts'
  | 'trackName'

type TestTracksTableProps = {
  columns?: TracksTableColumn[]
  data: any[]
  defaultSorter?: (a: any, b: any) => number
  fetchBatchSize?: number
  fetchMoreTracks?: (offset: number, limit: number) => void
  fetchThreshold?: number
  isVirtualized?: boolean
  isReorderable?: boolean
  loading?: boolean
  onClickArtistName?: (track: any) => void
  onClickFavorite?: (track: any) => void
  onClickRemove?: (
    track: any,
    index: number,
    uid: string,
    timestamp: number
  ) => void
  onClickRepost?: (track: any) => void
  onClickRow?: (track: any, index: number) => void
  onClickTrackName?: (track: any) => void
  onReorderTracks?: (source: number, destination: number) => void
  onSortTracks?: (...props: any[]) => void
  playing?: boolean
  playingIndex?: number
  removeText?: string
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  tableClassName?: string
  totalRowCount?: number
  userId?: number | null
  wrapperClassName?: string
}

const defaultColumns: TracksTableColumn[] = [
  'playButton',
  'trackName',
  'artistName',
  'releaseDate',
  'listenDate',
  'length',
  'plays',
  'reposts',
  'overflowActions'
]

export const TestTracksTable = ({
  columns = defaultColumns,
  data,
  defaultSorter,
  isReorderable = false,
  fetchBatchSize,
  fetchMoreTracks,
  fetchThreshold,
  isVirtualized = false,
  loading = false,
  onClickArtistName,
  onClickFavorite,
  onClickRemove,
  onClickRepost,
  onClickRow,
  onClickTrackName,
  onReorderTracks,
  onSortTracks,
  playing = false,
  playingIndex = -1,
  removeText,
  scrollRef,
  tableClassName,
  totalRowCount,
  userId,
  wrapperClassName
}: TestTracksTableProps) => {
  // Cell Render Functions
  const renderPlayButtonCell = useCallback(
    (cellInfo) => {
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

  const renderTrackNameCell = useCallback(
    (cellInfo) => {
      const track = cellInfo.row.original
      const index = cellInfo.row.index
      const deleted = track.is_delete || track.user?.is_deactivated
      return (
        <div
          className={styles.textContainer}
          onClick={(e) => {
            e.stopPropagation()
            if (!deleted) onClickTrackName?.(track)
          }}
        >
          <div
            className={cn(styles.textCell, {
              [styles.trackName]: !deleted,
              [styles.isPlaying]: index === playingIndex
            })}
          >
            {track.name}
            {deleted ? ` [Deleted By Artist]` : ''}
          </div>
        </div>
      )
    },
    [onClickTrackName, playingIndex]
  )

  const renderArtistNameCell = useCallback(
    (cellInfo) => {
      const track = cellInfo.row.original
      const index = cellInfo.row.index
      if (track.user?.is_deactivated) {
        return `${track.user?.name} [Deactivated]`
      }

      return (
        <div className={styles.artistCellContainer}>
          <ArtistPopover handle={track.user.handle}>
            <div
              className={styles.textContainer}
              onClick={(e) => {
                e.stopPropagation()
                onClickArtistName?.(track)
              }}
            >
              <div
                className={cn(styles.textCell, styles.artistName, {
                  [styles.isPlaying]: index === playingIndex
                })}
              >
                {track.artist}
              </div>
              <UserBadges
                userId={track.user.user_id}
                badgeSize={12}
                className={styles.badges}
              />
            </div>
          </ArtistPopover>
        </div>
      )
    },
    [onClickArtistName, playingIndex]
  )

  const renderPlaysCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return formatCount(track.plays)
  }, [])

  const renderRepostsCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return formatCount(track.repost_count)
  }, [])

  const renderLengthCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return formatSeconds(track.time)
  }, [])

  const renderDateCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return moment(track.date).format('M/D/YY')
  }, [])

  const renderAddedDateCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return moment(track.dateSaved).format('M/D/YY')
  }, [])

  const renderReleaseDateCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return moment(track.created_at).format('M/D/YY')
  }, [])

  const renderListenDateCell = useCallback((cellInfo) => {
    const track = cellInfo.row.original
    return moment(track.dateListened).format('M/D/YY')
  }, [])

  const favoriteButtonRef = useRef<HTMLDivElement>(null)
  const renderFavoriteButtonCell = useCallback(
    (cellInfo) => {
      const track = cellInfo.row.original
      const deleted = track.is_delete || !!track.user?.is_deactivated
      const isOwner = track.owner_id === userId
      if (deleted || isOwner) return null

      return (
        <Tooltip
          text={track.has_current_user_saved ? 'Unfavorite' : 'Favorite'}
        >
          <div ref={favoriteButtonRef}>
            <TableFavoriteButton
              className={cn(styles.tableActionButton, {
                [styles.active]: track.has_current_user_saved
              })}
              onClick={() => onClickFavorite?.(track)}
              favorited={track.has_current_user_saved}
            />
          </div>
        </Tooltip>
      )
    },
    [onClickFavorite, userId]
  )

  const repostButtonRef = useRef<HTMLDivElement>(null)
  const renderRepostButtonCell = useCallback(
    (cellInfo) => {
      const track = cellInfo.row.original
      const deleted = track.is_delete || track.user?.is_deactivated
      if (deleted) return null
      const isOwner = track.owner_id === userId
      return isOwner ? null : (
        <Tooltip text={track.has_current_user_reposted ? 'Unrepost' : 'Repost'}>
          <div ref={repostButtonRef}>
            <TableRepostButton
              className={cn(styles.tableActionButton, {
                [styles.active]: track.has_current_user_reposted
              })}
              onClick={() => onClickRepost?.(track)}
              reposted={track.has_current_user_reposted}
            />
          </div>
        </Tooltip>
      )
    },
    [onClickRepost, userId]
  )

  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const renderOverflowMenuCell = useCallback(
    (cellInfo) => {
      const track = cellInfo.row.original
      const deleted = track.is_delete || !!track.user.is_deactivated
      return (
        <div ref={overflowMenuRef}>
          <OverflowMenuButton
            className={styles.tableActionButton}
            isDeleted={deleted}
            onRemove={onClickRemove}
            removeText={removeText}
            handle={track.handle}
            trackId={track.track_id}
            uid={track.uid}
            date={track.date}
            isFavorited={track.has_current_user_saved}
            isOwner={track.owner_id === userId}
            isOwnerDeactivated={!!track.user.is_deactivated}
            isArtistPick={track.user._artist_pick === track.track_id}
            index={cellInfo.row.index}
            trackTitle={track.name}
            albumId={null}
            albumName={null}
            trackPermalink={track.permalink}
          />
        </div>
      )
    },
    [onClickRemove, removeText, userId]
  )

  const renderTrackActions = useCallback(
    (cellInfo) => {
      return (
        <div className={styles.trackActionsContainer}>
          {renderRepostButtonCell(cellInfo)}
          {renderFavoriteButtonCell(cellInfo)}
          {renderOverflowMenuCell(cellInfo)}
        </div>
      )
    },
    [renderFavoriteButtonCell, renderOverflowMenuCell, renderRepostButtonCell]
  )

  // Columns
  const tableColumnMap: Record<
    TracksTableColumn,
    Partial<ColumnInstance>
  > = useMemo(
    () => ({
      addedDate: {
        id: 'dateAdded',
        Header: 'Added',
        accessor: 'dateSaved',
        Cell: renderAddedDateCell,
        maxWidth: 160,
        sortTitle: 'Date Added',
        sorter: dateSorter('dateSaved'),
        align: 'right'
      },
      artistName: {
        id: 'artistName',
        Header: 'Artist',
        accessor: 'artist',
        Cell: renderArtistNameCell,
        maxWidth: 300,
        width: 120,
        sortTitle: 'Artist Name',
        sorter: alphaSorter('artist'),
        align: 'left'
      },
      date: {
        id: 'date',
        Header: 'Date',
        accessor: 'date',
        Cell: renderDateCell,
        maxWidth: 160,
        sortTitle: 'Date Listened',
        sorter: dateSorter('date'),
        align: 'right'
      },
      listenDate: {
        id: 'dateListened',
        Header: 'Played',
        accessor: 'dateListened',
        Cell: renderListenDateCell,
        maxWidth: 160,
        sortTitle: 'Date Listened',
        sorter: dateSorter('dateListened'),
        align: 'right'
      },
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
      plays: {
        id: 'plays',
        Header: 'Plays',
        accessor: 'plays',
        Cell: renderPlaysCell,
        maxWidth: 160,
        sortTitle: 'Plays',
        sorter: numericSorter('plays'),
        align: 'right'
      },
      playButton: {
        id: 'playButton',
        Cell: renderPlayButtonCell,
        minWidth: 48,
        maxWidth: 48,
        disableResizing: true,
        disableSortBy: true
      },
      overflowActions: {
        id: 'trackActions',
        Cell: renderTrackActions,
        minWidth: 144,
        maxWidth: 144,
        width: 144,
        disableResizing: true,
        disableSortBy: true
      },
      length: {
        id: 'time',
        Header: 'Length',
        accessor: 'time',
        Cell: renderLengthCell,
        maxWidth: 160,
        sortTitle: 'Track Length',
        sorter: numericSorter('time'),
        align: 'right'
      },
      trackName: {
        id: 'trackName',
        Header: 'Track Name',
        accessor: 'title',
        Cell: renderTrackNameCell,
        maxWidth: 300,
        width: 120,
        sortTitle: 'Track Name',
        sorter: alphaSorter('title'),
        align: 'left'
      }
    }),
    [
      renderAddedDateCell,
      renderArtistNameCell,
      renderDateCell,
      renderLengthCell,
      renderListenDateCell,
      renderPlayButtonCell,
      renderPlaysCell,
      renderReleaseDateCell,
      renderRepostsCell,
      renderTrackActions,
      renderTrackNameCell
    ]
  )

  const tableColumns = useMemo(
    () => columns.map((id) => tableColumnMap[id]),
    [columns, tableColumnMap]
  )

  const handleClickRow = useCallback(
    (e, rowInfo, index: number) => {
      const track = rowInfo.original
      const deleted = track.is_delete || track.user?.is_deactivated
      const clickedActionButton = [
        favoriteButtonRef,
        repostButtonRef,
        overflowMenuRef
      ].some((ref) => isDescendantElementOf(e?.target, ref.current))

      if (deleted || clickedActionButton) return
      onClickRow?.(track, index)
    },
    [onClickRow]
  )

  const getRowClassName = useCallback(
    (rowIndex) => {
      const track = data[rowIndex]
      const deleted = track?.is_delete || !!track?.user?.is_deactivated
      return cn(styles.tableRow, { [styles.disabled]: deleted })
    },
    [data]
  )

  return (
    <TestTable
      activeIndex={playingIndex}
      columns={tableColumns}
      data={data}
      defaultSorter={defaultSorter}
      fetchBatchSize={fetchBatchSize}
      fetchMore={fetchMoreTracks}
      fetchThreshold={fetchThreshold}
      getRowClassName={getRowClassName}
      isReorderable={isReorderable}
      isVirtualized={isVirtualized}
      loading={loading}
      onClickRow={handleClickRow}
      onReorder={onReorderTracks}
      onSort={onSortTracks}
      scrollRef={scrollRef}
      tableClassName={tableClassName}
      totalRowCount={totalRowCount}
      wrapperClassName={wrapperClassName}
    />
  )
}
