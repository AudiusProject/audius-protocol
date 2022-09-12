import { createRef, Component } from 'react'

import { formatCount, formatSeconds } from '@audius/common'
import Table from 'antd/lib/table'
import cn from 'classnames'
import moment from 'moment'
import PropTypes from 'prop-types'
import {
  DragDropContext,
  Droppable as RbdDroppable,
  Draggable as RbdDraggable
} from 'react-beautiful-dnd'

import { ReactComponent as IconCarrotDown } from 'assets/img/iconCaretDown.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Draggable from 'components/dragndrop/Draggable'
import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import TableDragHandle from 'components/tracks-table/TableDragHandle'
import TableFavoriteButton from 'components/tracks-table/TableFavoriteButton'
import TableOptionsButton from 'components/tracks-table/TableOptionsButton'
import TablePlayButton from 'components/tracks-table/TablePlayButton'
import TableRepostButton from 'components/tracks-table/TableRepostButton'
import UserBadges from 'components/user-badges/UserBadges'
import { isDescendantElementOf } from 'utils/domUtils'
import { fullTrackPage } from 'utils/route'

import styles from './TracksTable.module.css'

/**
 * Sorter for two items based on their alphanumeric (lowercase) value.
 * If the two values are equal, the values are sorted on unique keys if provided.
 * @param {string} a
 * @param {string} b
 * @param {string=} aKey
 * @param {string=} bKey
 */
export const alphaSortFn = function (a, b, aKey, bKey) {
  if (a.toLowerCase() === b.toLowerCase() && aKey && bKey) return aKey < bKey
  return a.toLowerCase() > b.toLowerCase() ? 1 : -1
}

const favoriteButtonCell = (val, record, props, storeActionButtonRefs) => {
  const deleted = record.is_delete || !!record.user?.is_deactivated
  const isOwner = record.owner_id === props.userId
  if (deleted || isOwner) return null

  const favoriteButtonRef = createRef()
  storeActionButtonRefs(record.key, favoriteButtonRef)
  return (
    <div ref={favoriteButtonRef}>
      <Tooltip text={record.has_current_user_saved ? 'Unfavorite' : 'Favorite'}>
        <span>
          <TableFavoriteButton
            className={cn(styles.favoriteButtonFormatting, {
              [styles.deleted]: deleted
            })}
            onClick={() => props.onClickFavorite(record)}
            favorited={record.has_current_user_saved}
          />
        </span>
      </Tooltip>
    </div>
  )
}

const trackNameCell = (val, record, props) => {
  const deleted = record.is_delete || record.user?.is_deactivated
  return (
    <div
      className={styles.textContainer}
      onClick={(e) => {
        e.stopPropagation()
        if (!deleted) props.onClickTrackName(record)
      }}
    >
      <div className={cn(styles.textCell, { [styles.trackName]: !deleted })}>
        {val}
        {deleted ? ` [Deleted By Artist]` : ''}
      </div>
    </div>
  )
}

const artistNameCell = (val, record, props) => {
  if (record.user?.is_deactivated) {
    return `${record.user?.name} [Deactivated]`
  }
  return (
    <ArtistPopover handle={record.handle}>
      <div
        className={styles.textContainer}
        onClick={(e) => {
          e.stopPropagation()
          props.onClickArtistName(record)
        }}
      >
        <div className={cn(styles.textCell, styles.artistName)}>{val}</div>
        <UserBadges
          userId={record.owner_id}
          badgeSize={12}
          className={styles.badges}
        />
      </div>
    </ArtistPopover>
  )
}

const repostButtonCell = (val, record, props, storeActionButtonRefs) => {
  const deleted = record.is_delete || record.user?.is_deactivated
  if (deleted) return null
  if (record.owner_id === props.userId) return null

  const repostButtonRef = createRef()
  storeActionButtonRefs(record.key, repostButtonRef)

  return (
    <Tooltip text={record.has_current_user_reposted ? 'Unrepost' : 'Repost'}>
      <div ref={repostButtonRef}>
        <TableRepostButton
          onClick={() => props.onClickRepost(record)}
          reposted={record.has_current_user_reposted}
        />
      </div>
    </Tooltip>
  )
}

const optionsButtonCell = (
  val,
  record,
  index,
  props,
  storeActionButtonRefs
) => {
  const deleted = record.is_delete || !!record.user.is_deactivated
  const optionsButtonRef = createRef()
  storeActionButtonRefs(record.key, optionsButtonRef)

  return (
    <div ref={optionsButtonRef}>
      <TableOptionsButton
        className={styles.optionsButtonFormatting}
        isDeleted={deleted}
        onRemove={props.onClickRemove}
        removeText={props.removeText}
        handle={val.handle}
        trackId={val.track_id}
        uid={val.uid}
        date={val.date}
        isFavorited={val.has_current_user_saved}
        isOwner={record.owner_id === props.userId}
        isOwnerDeactivated={!!record.user.is_deactivated}
        isArtistPick={val.user._artist_pick === val.track_id}
        index={index}
        trackTitle={val.name}
        albumId={null}
        albumName={null}
        trackPermalink={val.permalink}
      />
    </div>
  )
}

const dragHandleCell = (props) => {
  return <TableDragHandle {...props} />
}

const ShowLimitTab = (props) => {
  return (
    <div className={styles.showMoreContainer} onClick={props.onClick}>
      <span className={styles.showMoreText}>
        Show {props.showMore ? 'More' : 'Less'}
      </span>
      <IconCarrotDown
        className={cn(styles.showMoreIcon, {
          [styles.iconShowLess]: !props.showMore
        })}
      />
    </div>
  )
}

const Loading = (props) => <Skeleton height={18} />

const DraggableRow = (props) => {
  const {
    'data-row-key': dataRowKey,
    children,
    handleProps,
    ...otherProps
  } = props
  // Fetch the record from the children passed to this row. This is ugly,
  // but unfortunately kind-of necessary because of the way antd passes table
  // record props around. Children.length should be always > 0 if there is a
  // single column in the table.
  if (children.length > 0) {
    let record
    if (handleProps) {
      record = children[1].props.record
      const loading = !record.track_id
      // Hack to make the first child the draggable handle.
      children[0] = (
        <TableDragHandle
          key={`${dataRowKey}_handle`}
          {...handleProps}
          loading={loading}
        />
      )
    } else {
      record = children[0].props.record
    }
    const link = record.user ? fullTrackPage(record.permalink) : ''
    return (
      <Draggable
        elementType='tr'
        key={dataRowKey}
        text={record.title}
        kind='track'
        id={record.track_id}
        link={link}
        isOwner={record.isOwner}
        isDisabled={record.is_unlisted}
        {...otherProps}
      >
        {children}
      </Draggable>
    )
  }
  return null
}

const ReorderableRow = (props) => {
  const { 'data-row-key': dataRowKey, index } = props

  return (
    <RbdDraggable key={dataRowKey} draggableId={index.toString()} index={index}>
      {(provided, snapshot) => {
        return (
          <DraggableRow
            {...props}
            {...provided.draggableProps}
            handleProps={provided.dragHandleProps}
            forwardRef={provided.innerRef}
            className={cn({
              [props.className]: props.className,
              [styles.dragging]: snapshot.isDragging
            })}
          />
        )
      }}
    </RbdDraggable>
  )
}

const ReorderableBody = (props) => {
  return (
    <RbdDroppable droppableId='tracks-table-droppable' type='TABLE'>
      {(provided, snapshot) => (
        <tbody
          {...props}
          ref={provided.innerRef}
          {...provided.droppableProps}
        />
      )}
    </RbdDroppable>
  )
}

// Each column in the table is mapped to a min-width to calculate
// when a removed column can be added back.
const columns = {
  colPlayButton: { name: 'colPlayButton', minWidth: 64 },
  colFavoriteButton: {
    name: 'colFavoriteButton',
    minWidth: 16
  },
  colTrackName: { name: 'colTrackName', minWidth: 200 },
  colArtistName: { name: 'colArtistName', minWidth: 200 },
  colDate: { name: 'colDate', minWidth: 140 },
  colTime: { name: 'colTime', minWidth: 85 },
  colPlays: { name: 'colPlays', minWidth: 72 },
  colRepostButton: { name: 'colRepostButton', minWidth: 48 },
  colOptionsButton: {
    name: 'colOptionsButton',
    minWidth: 32
  }
}

// Optional Column
const tableDragHandleWidth = 32

// The Columns to drop on shrinking window size
const columnsToDrop = [columns.colTime, columns.colDate, columns.colPlays]

// The smallest size with all the columns present
const totalMinWidth = Object.values(columns).reduce(
  (total, col) => (total += col.minWidth),
  0
)

// The smallest size after removing columns to drop
const minWidthReducedColumns = columnsToDrop.reduce(
  (total, col) => (total -= col.minWidth),
  totalMinWidth
)

class TracksTable extends Component {
  constructor(props) {
    super(props)
    this.storeActionButtonRefs = this.storeActionButtonRefs.bind(this)
  }

  state = {
    limit: this.props.limit,
    hasRendered: false,

    // Hold a mapping of columns to drop to boolean if they are displayed
    displayedColumns: columnsToDrop.reduce((acc, col) => {
      acc[col.name] = true
      return acc
    }, {})
  }

  tableRef = null

  actionButtonRefs = {}

  componentDidMount() {
    window.addEventListener('resize', this.checkDropColumn)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkDropColumn)
  }

  storeActionButtonRefs = (key, ref) => {
    this.actionButtonRefs[key] = ref
  }

  onSetTableRef = (ref) => {
    this.tableRef = ref
    this.checkDropColumn()
  }

  // Check if columns should be drop or added back backed on table size
  checkDropColumn = () => {
    const table = document.querySelector(
      `.${styles.tracksTableContainer} table`
    )
    if (this.tableRef && table) {
      const displayWidth = this.tableRef.clientWidth
      const tableWidth = table.clientWidth
      // If the table is larger than its container, remove columns until it fits
      if (displayWidth < tableWidth) {
        let widthDiff = tableWidth - displayWidth
        const currentDisplayedColumns = { ...this.state.displayedColumns }
        for (const col of columnsToDrop) {
          if (currentDisplayedColumns[col.name]) {
            widthDiff -= col.minWidth
            currentDisplayedColumns[col.name] = false
          }
          if (widthDiff <= 0) break
        }
        this.setState({ displayedColumns: currentDisplayedColumns })
      } else {
        // If some columns are not displayed, check min size of existing columns to see if
        // adding back removed columns would fit
        if (columnsToDrop.some((col) => !this.state.displayedColumns[col])) {
          let startWidth =
            minWidthReducedColumns +
            (this.props.allowReordering ? tableDragHandleWidth : 0)
          const currentDisplayedColumns = { ...this.state.displayedColumns }
          // Loop over dropped columns in reverse order to add them back
          for (let i = 0; i < columnsToDrop.length; i += 1) {
            const col = columnsToDrop[columnsToDrop.length - 1 - i]
            if (currentDisplayedColumns[col.name]) {
              startWidth += col.minWidth
            } else {
              if (startWidth + col.minWidth < displayWidth) {
                startWidth += col.minWidth
                currentDisplayedColumns[col.name] = true
              } else {
                break
              }
            }
          }
          this.setState({ displayedColumns: currentDisplayedColumns })
        }
      }
    }
  }

  // Used when reordering is enabled to add custom styling to
  // the antd table components.
  reorderableComponents = {
    body: {
      wrapper: ReorderableBody,
      row: ReorderableRow
    }
  }

  // Used when drag and drop is enabled to add custom styling to
  // the antd table components.
  draggableComponents = {
    body: {
      row: DraggableRow
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevProps.loading && !this.props.loading) ||
      (!prevState.hasRendered && this.state.hasRendered)
    ) {
      this.checkDropColumn()
    }
  }

  getColumns = (loading) => {
    const columns =
      this.props.columns ||
      [
        {
          title: '',
          key: 'playButton',
          className: 'colPlayButton',
          render: (val, record, index) =>
            loading || record.is_delete || record.user?.is_deactivated ? (
              <div />
            ) : (
              <TablePlayButton
                paused={!this.props.playing}
                playing={index === this.props.playingIndex}
                className={styles.playButtonFormatting}
              />
            )
        },
        {
          title: '',
          key: 'favoriteButton',
          className: 'colFavoriteButton',
          render: (val, record) =>
            loading || record.is_delete || record.user?.is_deactivated ? (
              <div />
            ) : (
              favoriteButtonCell(
                val,
                record,
                this.props,
                this.storeActionButtonRefs
              )
            )
        },
        {
          title: <Tooltip text='Track Name'>{'Track Name'}</Tooltip>,
          dataIndex: 'name',
          key: 'name',
          className: 'colTrackName',
          sorter: loading
            ? null
            : (a, b) => alphaSortFn(a.name, b.name, a.key, b.key),
          render: (val, record) =>
            loading ? <Loading /> : trackNameCell(val, record, this.props)
        },
        {
          title: <Tooltip text='Artist'>{'Artist'}</Tooltip>,
          dataIndex: 'artist',
          key: 'artist',
          className: 'colArtistName',
          sorter: loading
            ? null
            : (a, b) => alphaSortFn(a.artist, b.artist, a.key, b.key),
          render: (val, record) =>
            loading ? <Loading /> : artistNameCell(val, record, this.props)
        },
        this.state.displayedColumns.colDate && {
          title: <Tooltip text='Date Added'>{'Date'}</Tooltip>,
          dataIndex: 'date',
          key: 'date',
          className: 'colDate',
          render: (val) =>
            loading ? <Loading /> : moment(val).format('M/D/YY'),
          sorter: loading ? null : (a, b) => moment(a.date) - moment(b.date)
        },
        this.state.displayedColumns.colTime && {
          title: <Tooltip text='Track Length'>{'Time'}</Tooltip>,
          dataIndex: 'time',
          key: 'time',
          className: 'colTime',
          sorter: loading ? null : (a, b) => a.time - b.time,
          render: (val) => (loading ? <Loading /> : formatSeconds(val))
        },
        this.state.displayedColumns.colPlays && {
          title: <Tooltip text='Total Plays'>{'Plays'}</Tooltip>,
          dataIndex: 'plays',
          key: 'plays',
          className: 'colPlays',
          sorter: loading ? null : (a, b) => a.plays - b.plays,
          render: (val) => (loading ? <Loading /> : formatCount(val))
        },
        {
          title: '',
          key: 'repostButton',
          className: 'colRepostButton',
          render: (val, record) =>
            loading ? (
              <div />
            ) : (
              repostButtonCell(
                val,
                record,
                this.props,
                this.storeActionButtonRefs
              )
            )
        },
        {
          title: '',
          key: 'optionsButton',
          className: 'colOptionsButton',
          render: (val, record, index) =>
            loading ? (
              <div />
            ) : (
              optionsButtonCell(
                val,
                record,
                index,
                this.props,
                this.storeActionButtonRefs
              )
            )
        }
      ].filter(Boolean)
    if (this.props.allowReordering) {
      columns.unshift({
        title: '',
        key: 'handle',
        // This render method is only a proxy. It is overridden.
        render: (val, record, index) => dragHandleCell(this.props)
      })
    }
    if (!this.state.hasRendered) {
      this.setState({ hasRendered: true })
    }

    return columns
  }

  onToggleShowTracks = () => {
    const limit =
      this.state.limit === this.props.limit
        ? this.props.dataSource.length
        : this.props.limit
    this.setState({ limit })
    this.props.didToggleShowTracks()
  }

  getRowClassName = (record, index) => {
    const { playingIndex } = this.props
    const deleted = record.is_delete || record.user?.is_deactivated

    if (deleted) return styles.deleted
    return index === playingIndex ? styles.activeRow : styles.inactiveRow
  }

  onTableChange = (pagination, filters, sorters, extras) => {
    this.props.onSortTracks(sorters)
  }

  onDragEnd = (result) => {
    const { source, destination } = result

    if (!source || !destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return
    this.props.onReorderTracks(source.index, destination.index)
  }

  render() {
    const {
      onClickRow,
      limit,
      loading,
      loadingRowsCount,
      allowReordering,
      animateTransitions
    } = this.props

    let dataSource = this.props.dataSource.map((record) => ({
      ...record,
      isOwner: record.owner_id === this.props.userId
    }))

    const { limit: displayLimit } = this.state
    const displayDataSource = limit
      ? dataSource.slice(0, displayLimit)
      : dataSource
    if (loading && loadingRowsCount) {
      dataSource = [...Array(loadingRowsCount)].map((x, i) => ({
        key: i
      }))
    }
    // Calculate the height to animate show more/less if there is a limit on table
    const tableStyle = limit
      ? { height: 40 + 39 * displayDataSource.length }
      : {}
    const columns = this.getColumns(loading)
    return (
      <div
        className={cn(styles.tracksTableContainer, {
          [styles.loading]: loading
        })}
        ref={this.onSetTableRef}
      >
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Table
            showSorterTooltip={false}
            dataSource={dataSource}
            columns={columns}
            components={
              allowReordering
                ? this.reorderableComponents
                : this.draggableComponents
            }
            pagination={false}
            className={cn({
              [styles.table]: !!limit,
              [styles.transitioningTable]: animateTransitions
            })}
            style={tableStyle}
            rowClassName={this.getRowClassName}
            onChange={this.onTableChange}
            fixed
            onRow={(record, rowIndex) => ({
              index: rowIndex,
              onClick: ((actionButtonRefs, e) => {
                const deleted = record.is_delete || record.user?.is_deactivated

                const clickedActionButton = Object.values(
                  actionButtonRefs
                ).some((ref) => isDescendantElementOf(e?.target, ref.current))

                if (deleted || clickedActionButton) return
                onClickRow(record, rowIndex)
              }).bind(this, this.actionButtonRefs)
            })}
            locale={
              loading
                ? { emptyText: '' }
                : { emptyText: 'No matching results 😢' }
            }
          />
          {limit && dataSource.length > limit ? (
            <ShowLimitTab
              onClick={this.onToggleShowTracks}
              showMore={displayDataSource.length === limit}
            />
          ) : null}
        </DragDropContext>
      </div>
    )
  }
}

TracksTable.propTypes = {
  dataSource: PropTypes.array,
  limit: PropTypes.number,
  // When making columns, the width attribute doesn't confine the cell to that size
  // So, set a max-width on the rendered componnet for size, else it will expand
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      key: PropTypes.string,
      width: PropTypes.number,
      className: PropTypes.string,
      render: PropTypes.func
    })
  ),
  // Current user id.
  userId: PropTypes.number,
  onClickRow: PropTypes.func,
  onClickFavorite: PropTypes.func,
  onClickTrackName: PropTypes.func,
  onClickArtistName: PropTypes.func,
  onClickRepost: PropTypes.func,
  onSortTracks: PropTypes.func,
  onReorderTracks: PropTypes.func,
  onClickRemove: PropTypes.func,
  removeText: PropTypes.string,
  loading: PropTypes.bool,
  loadingRowsCount: PropTypes.number,
  allowReordering: PropTypes.bool,
  onReorder: PropTypes.func,
  didToggleShowTracks: PropTypes.func,
  animateTransitions: PropTypes.bool
}

TracksTable.defaultProps = {
  loading: false,
  loadingRowsCount: 10,
  dataSource: [],
  onClickRow: () => {},
  onClickFavorite: () => {},
  onClickTrackName: () => {},
  onClickArtistName: () => {},
  onClickRepost: () => {},
  onSortTracks: () => {},
  onReorderTracks: () => {},
  didToggleShowTracks: () => {},
  onClickRemove: null,
  removeText: '',
  animateTransitions: true
}

export default TracksTable
