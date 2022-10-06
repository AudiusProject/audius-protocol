import { useCallback, useEffect, useMemo, useState } from 'react'

import { ID, Kind } from '@audius/common'
import cn from 'classnames'
import { debounce, range } from 'lodash'
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
import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'
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
  fetchPage?: (page: number) => void
  fetchThreshold?: number
  getRowClassName?: (rowIndex: number) => string
  isPaginated?: boolean
  isReorderable?: boolean
  isVirtualized?: boolean
  loading?: boolean
  onClickRow?: (e: any, rowInfo: any, index: number) => void
  onReorder?: (source: number, destination: number) => void
  onShowMoreToggle?: (setting: boolean) => void
  onSort?: (...props: any[]) => void
  pageSize?: number
  scrollRef?: React.MutableRefObject<HTMLDivElement | undefined>
  showMoreLimit?: number
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
  fetchPage,
  fetchThreshold = FETCH_THRESHOLD,
  getRowClassName,
  isPaginated = false,
  isReorderable = false,
  isVirtualized = false,
  loading = false,
  onClickRow,
  onReorder,
  onShowMoreToggle,
  onSort,
  pageSize = 50,
  scrollRef,
  showMoreLimit,
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

  // Pagination page
  const [currentPage, setCurrentPage] = useState<number>(0)
  const maxPage = useMemo(() => {
    return Math.floor(totalRowCount / pageSize)
  }, [pageSize, totalRowCount])

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
      manualSortBy: Boolean(onSort)
    },
    useSortBy,
    useResizeColumns,
    useFlexLayout
  )

  const [showMore, setShowMore] = useState(
    !showMoreLimit || pageSize < showMoreLimit
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

  const renderTableHeader = useCallback((column) => {
    return (
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
        <div {...column.getSortByToggleProps()} title=''>
          <div className={styles.textCell}>
            <Tooltip text={column.sortTitle} mount='page'>
              {column.render('Header')}
            </Tooltip>
          </div>
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
    )
  }, [])

  const renderHeaders = useCallback(() => {
    return headerGroups.map((headerGroup) => {
      const headers = headerGroup.headers.filter(
        (header) => header.id !== 'trackActions' && header.id !== 'overflowMenu'
      )
      // Should only be one or the other
      const endHeaders = headerGroup.headers.filter(
        (header) => header.id === 'trackActions' || header.id === 'overflowMenu'
      )

      return (
        <tr
          className={styles.tableHeadRow}
          {...headerGroup.getHeaderGroupProps()}
          key={headerGroup.id}
        >
          <div className={styles.cellSection}>
            {headers.map(renderTableHeader)}
          </div>
          {endHeaders.length ? (
            <div
              className={cn(styles.cellSectionEnd, {
                [styles.menu]: endHeaders[0].id === 'overflowMenu'
              })}
            >
              {endHeaders.map(renderTableHeader)}
            </div>
          ) : null}
        </tr>
      )
    })
  }, [headerGroups, renderTableHeader])

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
      const cells = row.cells.filter(
        (cell: Cell) =>
          cell.column.id !== 'trackActions' && cell.column.id !== 'overflowMenu'
      )
      // Should only be one or the other
      const endCells = row.cells.filter(
        (cell: Cell) =>
          cell.column.id === 'trackActions' || cell.column.id === 'overflowMenu'
      )

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
          <div className={styles.cellSection}>{cells.map(renderCell)}</div>
          {endCells.length ? (
            <div
              className={cn(styles.cellSectionEnd, {
                [styles.menu]: endCells[0].column.id === 'overflowMenu'
              })}
            >
              {endCells.map(renderCell)}
            </div>
          ) : null}
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
    const displayRows = !showMore ? rows.slice(0, showMoreLimit) : rows
    return displayRows.map((row) => {
      prepareRow(row)
      const render = isReorderable ? renderDraggableRow : renderTableRow
      return render(row, row.id, { ...row.getRowProps() })
    })
  }, [
    showMoreLimit,
    showMore,
    rows,
    prepareRow,
    isReorderable,
    renderDraggableRow,
    renderTableRow
  ])

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

  // Pagination Functions
  const goToPage = useCallback(
    (page: number) => {
      if (page !== currentPage) setCurrentPage(page)
    },
    [currentPage]
  )

  const nextPage = useCallback(() => {
    if (currentPage < maxPage) goToPage(currentPage + 1)
  }, [currentPage, goToPage, maxPage])

  const prevPage = useCallback(() => {
    if (currentPage > 0) goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  useEffect(() => {
    fetchPage?.(currentPage)
  }, [currentPage, fetchPage])

  const renderPaginationControls = useCallback(() => {
    if (!isPaginated || maxPage === 0 || !showMore) return null

    return (
      <div className={styles.pageButtonContainer}>
        <IconCaretLeft
          className={cn(styles.pageCaret, {
            [styles.disabled]: currentPage <= 0
          })}
          onClick={prevPage}
        />
        {range(maxPage + 1).map((idx) => (
          <div
            key={`pageButton_${idx}`}
            className={cn(styles.pageButton, {
              [styles.active]: currentPage === idx
            })}
            onClick={() => goToPage(idx)}
          >
            {idx + 1}
          </div>
        ))}
        <IconCaretRight
          className={cn(styles.pageCaret, {
            [styles.disabled]: currentPage >= maxPage
          })}
          onClick={nextPage}
        />
      </div>
    )
  }, [
    currentPage,
    goToPage,
    isPaginated,
    maxPage,
    nextPage,
    prevPage,
    showMore
  ])

  const renderShowMoreControl = useCallback(() => {
    if (!showMoreLimit || rows.length <= showMoreLimit) return null

    const handleShowMoreToggle = () => {
      onShowMoreToggle?.(!showMore)
      setShowMore(!showMore)
    }

    return (
      <div className={styles.showMoreContainer} onClick={handleShowMoreToggle}>
        <p className={styles.showMoreText}>
          {showMore ? 'Show Less' : 'Show More'}
        </p>
        {showMore ? (
          <IconCaretUp className={styles.showMoreCaret} />
        ) : (
          <IconCaretDown className={styles.showMoreCaret} />
        )}
      </div>
    )
  }, [onShowMoreToggle, rows.length, showMore, showMoreLimit])

  const renderContent = useCallback(() => {
    return (
      <div className={cn(styles.tableWrapper, wrapperClassName)}>
        <table
          className={cn(styles.table, tableClassName)}
          {...getTableProps()}
        >
          <thead className={styles.tableHead}>{renderHeaders()}</thead>
          {loading ? (
            <LoadingSpinner className={styles.loader} />
          ) : (
            <tbody className={styles.tableBody} {...getTableBodyProps()}>
              {renderRows()}
            </tbody>
          )}
        </table>
        {renderPaginationControls()}
        {renderShowMoreControl()}
      </div>
    )
  }, [
    getTableBodyProps,
    getTableProps,
    loading,
    renderHeaders,
    renderPaginationControls,
    renderRows,
    renderShowMoreControl,
    tableClassName,
    wrapperClassName
  ])

  const renderVirtualizedContent = useCallback(() => {
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
                  <thead className={styles.tableHead}>{renderHeaders()}</thead>
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
                            rowHeight={64}
                            rowRenderer={renderRow}
                          />
                        )}
                      </AutoSizer>
                    </tbody>
                  )}
                </table>
              </div>
            )}
          </WindowScroller>
        )}
      </InfiniteLoader>
    )
  }, [
    debouncedFetchMore,
    fetchBatchSize,
    fetchThreshold,
    getTableBodyProps,
    getTableProps,
    isRowLoaded,
    loadMoreRows,
    loading,
    renderHeaders,
    renderRow,
    rows.length,
    scrollRef,
    tableClassName,
    totalRowCount,
    wrapperClassName
  ])

  return isVirtualized ? renderVirtualizedContent() : renderContent()
}
