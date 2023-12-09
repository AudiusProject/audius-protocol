import { MouseEvent, useCallback, useMemo, useRef } from 'react'

import {
  formatCount,
  formatSeconds,
  UID,
  usePremiumContentAccessMap,
  UserTrack
} from '@audius/common'
import { IconHidden, IconLock } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'
import { Cell, Row } from 'react-table'

import { Link, UserLink } from 'components/link'
import {
  Table,
  OverflowMenuButton,
  TableFavoriteButton,
  TablePlayButton,
  TableRepostButton,
  alphaSorter,
  dateSorter,
  numericSorter
} from 'components/table'
import Tooltip from 'components/tooltip/Tooltip'
import { isDescendantElementOf } from 'utils/domUtils'

import styles from './TracksTable.module.css'

const messages = {
  locked: 'Locked'
}

type RowInfo = UserTrack & {
  name: string
  artist: string
  date: string
  time: number
  plays: number
  dateSaved: string
  dateAdded: string
  handle: string
  uid: UID
}

type TrackCell = Cell<RowInfo>

type TrackRow = Row<RowInfo>

export type TracksTableColumn =
  | 'addedDate'
  | 'artistName'
  | 'date'
  | 'length'
  | 'listenDate'
  | 'overflowActions'
  | 'overflowMenu'
  | 'playButton'
  | 'plays'
  | 'releaseDate'
  | 'reposts'
  | 'savedDate'
  | 'spacer'
  | 'trackName'

type TracksTableProps = {
  columns?: TracksTableColumn[]
  data: any[]
  defaultSorter?: (a: any, b: any) => number
  disabledTrackEdit?: boolean
  fetchBatchSize?: number
  fetchMoreTracks?: (offset: number, limit: number) => void
  fetchPage?: (page: number) => void
  fetchThreshold?: number
  isVirtualized?: boolean
  isPaginated?: boolean
  isReorderable?: boolean
  loading?: boolean
  onClickFavorite?: (track: any) => void
  onClickRemove?: (
    track: any,
    index: number,
    uid: string,
    timestamp: number
  ) => void
  onClickRepost?: (track: any) => void
  onClickRow?: (track: any, index: number) => void
  onReorderTracks?: (source: number, destination: number) => void
  onShowMoreToggle?: (setting: boolean) => void
  onSortTracks?: (...props: any[]) => void
  pageSize?: number
  playing?: boolean
  playingIndex?: number
  removeText?: string
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  showMoreLimit?: number
  tableClassName?: string
  totalRowCount?: number
  useLocalSort?: boolean
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

export const TracksTable = ({
  columns = defaultColumns,
  data,
  defaultSorter,
  disabledTrackEdit = false,
  isPaginated = false,
  isReorderable = false,
  fetchBatchSize,
  fetchMoreTracks,
  fetchPage,
  fetchThreshold,
  isVirtualized = false,
  loading = false,
  onClickFavorite,
  onClickRemove,
  onClickRepost,
  onClickRow,
  onReorderTracks,
  onShowMoreToggle,
  onSortTracks,
  pageSize,
  playing = false,
  playingIndex = -1,
  removeText,
  scrollRef,
  showMoreLimit,
  tableClassName,
  totalRowCount,
  useLocalSort = false,
  userId,
  wrapperClassName
}: TracksTableProps) => {
  const trackAccessMap = usePremiumContentAccessMap(data)

  // Cell Render Functions
  const renderPlayButtonCell = useCallback(
    (cellInfo: TrackCell) => {
      const index = cellInfo.row.index
      const active = index === playingIndex
      const track = cellInfo.row.original
      const isTrackUnlisted = track.is_unlisted

      return (
        <>
          <TablePlayButton
            className={cn(styles.tablePlayButton, { [styles.active]: active })}
            paused={!playing}
            playing={active}
            hideDefault={false}
          />
          {isTrackUnlisted ? (
            <IconHidden
              className={cn(styles.hiddenIcon, { [styles.hidden]: active })}
            />
          ) : null}
        </>
      )
    },
    [playing, playingIndex]
  )

  const renderTrackNameCell = useCallback(
    (cellInfo: TrackCell) => {
      const track = cellInfo.row.original
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const index = cellInfo.row.index
      const active = index === playingIndex
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated

      const renderLocked = () => {
        return (
          <div className={styles.locked}>
            <IconLock />
            <span>{messages.locked}</span>
          </div>
        )
      }

      return (
        <div className={styles.textContainer}>
          <Link
            variant='inherit'
            as={isLocked || deleted ? 'span' : undefined}
            to={isLocked || deleted ? '' : track.permalink}
            color={active ? 'primary' : 'neutral'}
            className={styles.trackCell}
          >
            {track.name}
            {deleted ? ` [Deleted By Artist]` : ''}
          </Link>
          {!deleted && isLocked ? renderLocked() : null}
        </div>
      )
    },
    [trackAccessMap, playingIndex]
  )

  const renderArtistNameCell = useCallback(
    (cellInfo: TrackCell) => {
      const { original: track, index } = cellInfo.row
      const { user } = track
      if (user?.is_deactivated) {
        return `${user?.name} [Deactivated]`
      }

      return (
        <div className={styles.artistCellContainer}>
          <UserLink
            className={styles.textCell}
            userId={user.user_id}
            size='small'
            strength='strong'
            color={index === playingIndex ? 'primary' : 'neutral'}
            badgeSize={12}
            popover
          />
        </div>
      )
    },
    [playingIndex]
  )

  const renderPlaysCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    const { plays } = track
    // negative plays indicates the track is hidden
    if (plays === -1) return '-'
    return formatCount(track.plays)
  }, [])

  const renderRepostsCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return formatCount(track.repost_count)
  }, [])

  const renderLengthCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return formatSeconds(track.time)
  }, [])

  const renderDateCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return moment(track.date).format('M/D/YY')
  }, [])

  const renderAddedDateCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return moment(track.dateAdded).format('M/D/YY')
  }, [])

  const renderSavedDateCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return moment(track.dateSaved).format('M/D/YY')
  }, [])

  const renderReleaseDateCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return moment(track.created_at).format('M/D/YY')
  }, [])

  const renderListenDateCell = useCallback((cellInfo: TrackCell) => {
    const track = cellInfo.row.original
    return moment(track.dateListened).format('M/D/YY')
  }, [])

  const favoriteButtonRef = useRef<HTMLDivElement>(null)
  const renderFavoriteButtonCell = useCallback(
    (cellInfo: TrackCell) => {
      const track = cellInfo.row.original
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated
      const isOwner = track.owner_id === userId
      if (isLocked || deleted || isOwner) {
        return <div className={styles.placeholderButton} />
      }

      return (
        <Tooltip
          text={track.has_current_user_saved ? 'Unfavorite' : 'Favorite'}
          mount='page'
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
    [trackAccessMap, onClickFavorite, userId]
  )

  const repostButtonRef = useRef<HTMLDivElement>(null)
  const renderRepostButtonCell = useCallback(
    (cellInfo: TrackCell) => {
      const track = cellInfo.row.original
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated
      const isOwner = track.owner_id === userId
      if (isLocked || deleted || isOwner) {
        return <div className={styles.placeholderButton} />
      }

      return (
        <Tooltip
          text={track.has_current_user_reposted ? 'Unrepost' : 'Repost'}
          mount='page'
        >
          <div ref={repostButtonRef}>
            <TableRepostButton
              className={cn(styles.tableActionButton, {
                [styles.active]: track.has_current_user_reposted
              })}
              onClick={(e) => {
                onClickRepost?.(track)
                e.stopPropagation()
              }}
              reposted={track.has_current_user_reposted}
            />
          </div>
        </Tooltip>
      )
    },
    [trackAccessMap, onClickRepost, userId]
  )

  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const renderOverflowMenuCell = useCallback(
    (cellInfo: TrackCell) => {
      const track = cellInfo.row.original
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated
      return (
        <div ref={overflowMenuRef}>
          <OverflowMenuButton
            className={styles.tableActionButton}
            isDeleted={deleted}
            includeEdit={!disabledTrackEdit}
            includeAddToPlaylist={!isLocked}
            includeFavorite={!isLocked}
            onRemove={onClickRemove}
            removeText={removeText}
            handle={track.handle}
            trackId={track.track_id}
            uid={track.uid}
            date={track.date}
            isFavorited={track.has_current_user_saved}
            isOwner={track.owner_id === userId}
            isOwnerDeactivated={!!track.user?.is_deactivated}
            isArtistPick={track.user?.artist_pick_track_id === track.track_id}
            index={cellInfo.row.index}
            trackTitle={track.name}
            trackPermalink={track.permalink}
          />
        </div>
      )
    },
    [trackAccessMap, disabledTrackEdit, onClickRemove, removeText, userId]
  )

  const renderTrackActions = useCallback(
    (cellInfo: TrackCell) => {
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
  const tableColumnMap = useMemo(
    () => ({
      addedDate: {
        id: 'dateAdded',
        Header: 'Added',
        accessor: 'dateAdded',
        Cell: renderAddedDateCell,
        maxWidth: 160,
        sortTitle: 'Date Added',
        sorter: dateSorter('dateAdded'),
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
        maxWidth: 120,
        width: 48,
        minWidth: 48,
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
      overflowMenu: {
        id: 'overflowMenu',
        Cell: renderOverflowMenuCell,
        minWidth: 64,
        maxWidth: 64,
        width: 64,
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
        disableSortBy: isVirtualized,
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
      },
      savedDate: {
        id: 'dateSaved',
        Header: 'Saved',
        accessor: 'dateSaved',
        Cell: renderSavedDateCell,
        maxWidth: 160,
        sortTitle: 'Date Saved',
        sorter: dateSorter('dateSaved'),
        align: 'right'
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
      isVirtualized,
      renderAddedDateCell,
      renderArtistNameCell,
      renderDateCell,
      renderLengthCell,
      renderListenDateCell,
      renderOverflowMenuCell,
      renderPlayButtonCell,
      renderPlaysCell,
      renderSavedDateCell,
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
    (e: MouseEvent<HTMLTableRowElement>, rowInfo: TrackRow, index: number) => {
      const track = rowInfo.original
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated
      const clickedActionButton = [
        favoriteButtonRef,
        repostButtonRef,
        overflowMenuRef
      ].some((ref) => isDescendantElementOf(e?.target, ref.current))

      if (isLocked || deleted || clickedActionButton) return
      onClickRow?.(track, index)
    },
    [trackAccessMap, onClickRow]
  )

  const getRowClassName = useCallback(
    (rowIndex: number) => {
      const track = data[rowIndex]
      const { isUserAccessTBD, doesUserHaveAccess } = trackAccessMap[
        track.track_id
      ] ?? { isUserAccessTBD: false, doesUserHaveAccess: true }
      const isLocked = !isUserAccessTBD && !doesUserHaveAccess
      const deleted =
        track.is_delete || track._marked_deleted || !!track.user?.is_deactivated
      return cn(styles.tableRow, {
        [styles.disabled]: isLocked || deleted,
        [styles.lockedRow]: isLocked && !deleted
      })
    },
    [trackAccessMap, data]
  )

  return (
    <Table
      activeIndex={playingIndex}
      columns={tableColumns}
      data={data}
      defaultSorter={defaultSorter}
      fetchBatchSize={fetchBatchSize}
      fetchMore={fetchMoreTracks}
      fetchPage={fetchPage}
      fetchThreshold={fetchThreshold}
      getRowClassName={getRowClassName}
      isPaginated={isPaginated}
      isReorderable={isReorderable}
      isTracksTable
      isVirtualized={isVirtualized}
      loading={loading}
      onClickRow={handleClickRow}
      onReorder={onReorderTracks}
      onShowMoreToggle={onShowMoreToggle}
      onSort={onSortTracks}
      pageSize={pageSize}
      scrollRef={scrollRef}
      showMoreLimit={showMoreLimit}
      tableClassName={tableClassName}
      totalRowCount={totalRowCount}
      useLocalSort={useLocalSort}
      wrapperClassName={wrapperClassName}
    />
  )
}
