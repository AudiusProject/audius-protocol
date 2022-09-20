import { useCallback, useEffect, useMemo } from 'react'

import { ID, Kind } from '@audius/common'
import cn from 'classnames'
import { debounce } from 'lodash'
import moment from 'moment'
import {
  useTable,
  useSortBy,
  useResizeColumns,
  useFlexLayout,
  Cell
} from 'react-table'
import {
  AutoSizer,
  List,
  InfiniteLoader,
  WindowScroller
} from 'react-virtualized'

import { ReactComponent as IconCaretDown } from 'assets/img/iconCaretDownLine.svg'
import { ReactComponent as IconCaretUp } from 'assets/img/iconCaretUpLine.svg'
import Draggable from 'components/dragndrop/Draggable'
import Droppable from 'components/dragndrop/Droppable'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './TestTable.module.css'

// - Infinite scroll constants -
// Fetch the next group of rows when the user scroll within X rows of the bottom
const FETCH_THRESHOLD = 40
// Number of rows to fetch in each batch
const FETCH_BATCH_SIZE = 80

// Column Sort Functions
export const numericSorter = (accessor: string) => (rowA: any, rowB: any) => {
  return rowA[accessor] - rowB[accessor]
}

export const alphaSorter = (accessor: string) => (rowA: any, rowB: any) => {
  if (
    rowA[accessor].trim().toLowerCase() < rowB[accessor].trim().toLowerCase()
  ) {
    return -1
  }
  if (
    rowA[accessor].trim().toLowerCase() > rowB[accessor].trim().toLowerCase()
  ) {
    return 1
  }
  return 0
}

export const dateSorter = (accessor: string) => (rowA: any, rowB: any) => {
  if (moment(rowB[accessor]).isAfter(rowA[accessor])) return 1
  if (moment(rowA[accessor]).isAfter(rowB[accessor])) return -1
  return 0
}

const isEmptyRow = (row: any) => {
  return Boolean(!row?.original?.uid || row?.original?.kind === Kind.EMPTY)
}

type TestTableProps = {
  activeIndex?: number
  columns: any[]
  data: any[]
  defaultSorter?: (a: any, b: any) => number
  fetchBatchSize?: number
  fetchMore?: (offset: number, limit: number) => void
  fetchThreshold?: number
  getRowClassName?: (rowIndex: number) => string
  isPaginated?: boolean
  isReorderable?: boolean
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (e: any, rowInfo: any, index: number) => void
  onReorder?: (source: number, destination: number) => void
  onSort?: (...props: any[]) => void
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  tableClassName?: string
  totalRowCount?: number
  wrapperClassName?: string
}

export const TestTable = ({
  activeIndex = -1,
  columns,
  data,
  defaultSorter,
  fetchBatchSize = FETCH_BATCH_SIZE,
  fetchMore,
  fetchThreshold = FETCH_THRESHOLD,
  getRowClassName,
  isPaginated = false,
  isReorderable = false,
  isVirtualized = false,
  loading = false,
  onClickRow,
  onReorder,
  onSort,
  scrollRef,
  tableClassName,
  totalRowCount = 9999,
  wrapperClassName
}: TestTableProps) => {
  const defaultColumn = useMemo(
    () => ({
      // Default resizing column props
      minWidth: 64,
      width: 64,
      maxWidth: 200
    }),
    []
  )
  const debouncedFetchMore = useMemo(
    () => (fetchMore ? debounce(fetchMore, 0) : null),
    [fetchMore]
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { sortBy }
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      autoResetSortBy: false,
      autoResetResize: false,
      manualSortBy: true
    },
    useSortBy,
    useResizeColumns,
    useFlexLayout
  )

  // NOTE: react-table allows for multple sorters, but we are only checking the first here
  // - This can be updated if we need multiple sorters in the future
  const handleSortChange = useCallback(() => {
    if (isVirtualized) {
      // Virtualized Table -> Pass back the selected column and direction for backend sorting
      if (sortBy.length === 0) return onSort?.('', '')

      const sortColumn = columns.find((c) => c.id === sortBy[0].id)
      const column = sortColumn.accessor
      const order = sortBy[0]?.desc ? 'desc' : 'asc'

      onSort?.(column, order)
    } else {
      // Non-virtualized table -> Pass back the sorter from the selected column for manual frontend sorting
      let sorter = null
      let sortColumn
      let order = 'ascend'

      if (sortBy.length === 0) {
        // Use defaultSorter if sortBy array is empty
        sorter = defaultSorter
      } else {
        // Use the sorter from the column
        sortColumn = columns.find((c) => c.id === sortBy[0].id)
        sorter = sortColumn?.sorter
        order = sortBy[0]?.desc ? 'descend' : 'ascend'
      }

      if (sorter) {
        onSort?.({ column: { sorter }, order })
      }
    }
  }, [columns, defaultSorter, isVirtualized, onSort, sortBy])

  useEffect(handleSortChange, [handleSortChange, sortBy])

  const renderHeader = useCallback(() => {
    return headerGroups.map((headerGroup) => (
      <tr
        className={styles.tableHeadRow}
        {...headerGroup.getHeaderGroupProps()}
        key={headerGroup.id}
      >
        {headerGroup.headers.map((column) => (
          <th
            className={cn(styles.tableHeader, {
              [styles.titleHeader]: Boolean(column.accessor),
              [styles.hasSorter]: column.disableSortBy !== true,
              [styles.leftAlign]: column.align === 'left',
              [styles.rightAlign]: column.align === 'right'
            })}
            {...column.getHeaderProps()}
            key={column.id}
          >
            {/* Sorting Container */}
            <Tooltip text={column.sortTitle} mount='page'>
              <div {...column.getSortByToggleProps()} title=''>
                <div className={styles.textCell}>{column.render('Header')}</div>
                {!column.disableSortBy ? (
                  <div className={styles.sortCaretContainer}>
                    {!column.isSorted || !column.isSortedDesc ? (
                      <IconCaretUp className={styles.sortCaret} />
                    ) : null}
                    {!column.isSorted || column.isSortedDesc ? (
                      <IconCaretDown className={styles.sortCaret} />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Tooltip>
            {/* Resizing Container */}
            {!column.disableResizing ? (
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                {...column.getResizerProps()}
                className={cn(styles.resizer, {
                  [styles.isResizing]: column.isResizing
                })}
              />
            ) : null}
          </th>
        ))}
      </tr>
    ))
  }, [headerGroups])

  const renderCell = useCallback(
    (cell: Cell) => (
      <td
        className={cn(styles.tableCell, {
          [styles.leftAlign]: cell.column.align === 'left',
          [styles.rightAlign]: cell.column.align === 'right'
        })}
        {...cell.getCellProps()}
        key={`${cell.row.id}_${cell.getCellProps().key}`}
      >
        {cell.render('Cell')}
      </td>
    ),
    []
  )

  const renderSkeletonCell = useCallback(
    (cell: Cell) => (
      <td
        className={cn(styles.tableCell)}
        {...cell.getCellProps()}
        key={`${cell.row.id}_skeletonCell_${cell.getCellProps().key}`}
      >
        <Skeleton />
      </td>
    ),
    []
  )

  const renderTableRow = useCallback(
    (row, key, props, className = '') => {
      return (
        <tr
          className={cn(
            styles.tableRow,
            getRowClassName?.(row.index),
            className,
            {
              [styles.active]: row.index === activeIndex
            }
          )}
          {...props}
          key={key}
          onClick={(e: MouseEvent) => onClickRow?.(e, row, row.index)}
        >
          {row.cells.map(renderCell)}
        </tr>
      )
    },
    [activeIndex, getRowClassName, onClickRow, renderCell]
  )

  const renderSkeletonRow = useCallback(
    (row, key, props, className = '') => {
      return (
        <tr
          className={cn(
            styles.tableRow,
            styles.skeletonRow,
            className,
            getRowClassName?.(row.index),
            {
              [styles.active]: row.index === activeIndex
            }
          )}
          {...props}
          key={key}
        >
          {row.cells.map(renderSkeletonCell)}
        </tr>
      )
    },
    [activeIndex, getRowClassName, renderSkeletonCell]
  )

  const onDragEnd = useCallback(
    ({ source, destination }) => {
      if (source === destination) return
      onReorder?.(source, source < destination ? destination - 1 : destination)
    },
    [onReorder]
  )

  const renderDraggableRow = useCallback(
    (row, key, props, className = '') => {
      return (
        <Droppable
          key={row.index}
          className={styles.droppable}
          hoverClassName={styles.droppableHover}
          onDrop={(id: ID | string, draggingKind: string) => {
            onDragEnd({ source: Number(id), destination: row.index })
          }}
          stopPropogationOnDrop={true}
          acceptedKinds={['table-row']}
        >
          <Draggable id={row.id} text={row.original.title} kind='table-row'>
            {renderTableRow(
              row,
              key,
              props,
              cn(styles.draggableRow, className)
            )}
          </Draggable>
        </Droppable>
      )
    },
    [onDragEnd, renderTableRow]
  )

  const renderRow = useCallback(
    ({ index, key, style }) => {
      const row = rows[index]
      prepareRow(row)

      let render
      if (isEmptyRow(row)) {
        render = renderSkeletonRow
      } else {
        render = isReorderable ? renderDraggableRow : renderTableRow
      }
      return render(row, key, { ...row.getRowProps({ style }) })
    },
    [
      rows,
      prepareRow,
      renderSkeletonRow,
      isReorderable,
      renderDraggableRow,
      renderTableRow
    ]
  )

  const renderRows = useCallback(() => {
    return rows.map((row) => {
      prepareRow(row)
      const render = isReorderable ? renderDraggableRow : renderTableRow
      return render(row, row.id, { ...row.getRowProps() })
    })
  }, [rows, prepareRow, isReorderable, renderDraggableRow, renderTableRow])

  // TODO: This is supposed to return a promise that resolves when the row data has been fetched.
  // It currently does not, but there are no issues with this currently so will fix if issues pop up
  const loadMoreRows = useCallback(
    async ({ startIndex, stopIndex }) => {
      if (!debouncedFetchMore) return null
      const offset = startIndex
      const limit = stopIndex - startIndex + 1
      debouncedFetchMore(offset, limit)
      return null
    },
    [debouncedFetchMore]
  )

  const isRowLoaded = useCallback(
    ({ index }) => !isEmptyRow(rows[index]),
    [rows]
  )

  const renderContent = () => {
    return (
      <div className={cn(styles.tableWrapper, wrapperClassName)}>
        <table
          className={cn(styles.table, tableClassName)}
          {...getTableProps()}
        >
          <thead className={styles.tableHead}>{renderHeader()}</thead>
          {loading ? (
            <LoadingSpinner className={styles.loader} />
          ) : (
            <tbody className={styles.tableBody} {...getTableBodyProps()}>
              {renderRows()}
            </tbody>
          )}
        </table>
        {isPaginated ? <p>Render the pagination controls here</p> : null}
      </div>
    )
  }

  const renderVirtualizedContent = () => {
    return (
      <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={loadMoreRows}
        rowCount={totalRowCount}
        threshold={fetchThreshold}
        minimumBatchSize={fetchBatchSize}
      >
        {({ onRowsRendered, registerChild: registerListChild }) => (
          <WindowScroller scrollElement={scrollRef?.current}>
            {({
              height,
              registerChild,
              isScrolling,
              onChildScroll,
              scrollTop
            }) => (
              <div className={cn(styles.tableWrapper, wrapperClassName)}>
                <table
                  className={cn(styles.table, tableClassName)}
                  {...getTableProps()}
                >
                  <thead className={styles.tableHead}>{renderHeader()}</thead>
                  {loading ? (
                    <LoadingSpinner className={styles.loader} />
                  ) : (
                    <tbody
                      className={styles.tableBody}
                      {...getTableBodyProps()}
                      ref={registerChild}
                    >
                      <AutoSizer disableHeight>
                        {({ width }) => (
                          <List
                            autoHeight
                            height={height}
                            width={width}
                            isScrolling={isScrolling}
                            onScroll={onChildScroll}
                            scrollTop={scrollTop}
                            onRowsRendered={(info) => onRowsRendered(info)}
                            ref={registerListChild}
                            overscanRowsCount={2}
                            rowCount={
                              debouncedFetchMore ? totalRowCount : rows.length
                            }
                            rowHeight={44}
                            rowRenderer={renderRow}
                          />
                        )}
                      </AutoSizer>
                    </tbody>
                  )}
                </table>
                {isPaginated ? (
                  <p>Render the pagination controls here</p>
                ) : null}
              </div>
            )}
          </WindowScroller>
        )}
      </InfiniteLoader>
    )
  }

  return isVirtualized ? renderVirtualizedContent() : renderContent()
}
