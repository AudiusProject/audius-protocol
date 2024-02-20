import React, { useCallback } from 'react'
import clsx from 'clsx'
import Paper from 'components/Paper'
import Loading from 'components/Loading'
import { Text } from '@audius/harmony'

import styles from './Table.module.css'
import Error from 'components/Error'

type TableProps = {
  className?: string

  // The table title displayed at the top
  // No title is rendered if unset
  title?: string

  // The label to appear in the same row as the title
  label?: string

  // If the table contents are loading in
  isLoading?: boolean

  // THe columns
  columns: Array<{ title: string; className?: string }>

  // Data to map to each row render
  data: Array<any>

  // Row rendering function
  renderRow: (props: any) => React.ReactNode

  // On row click
  onRowClick?: (row: any) => void

  // The max number of rows to show before limiting
  limit?: number

  // Always show more
  alwaysShowMore?: boolean

  // Text displayed at the bottom of the table if limit provided
  moreText?: string

  // On click action of moreText
  onClickMore?: () => void

  // If there was an error fetching data
  error?: boolean
}

type RowProps = {
  data: any
  onRowClick: (data: any) => void
  renderRow: (data: any) => React.ReactNode
}
const Row = ({ data, onRowClick, renderRow }: RowProps) => {
  const onClick = useCallback(() => {
    onRowClick(data)
  }, [onRowClick, data])
  return (
    <div className={styles.rowContainer} onClick={onClick}>
      {renderRow(data)}
    </div>
  )
}

const Table: React.FC<TableProps> = ({
  className,
  title,
  label,
  isLoading,
  columns,
  data,
  renderRow,
  limit,
  alwaysShowMore,
  moreText,
  onRowClick = () => {},
  onClickMore,
  error
}: TableProps) => {
  const rowLimit = limit || data.length
  const showMore = data.length > rowLimit || alwaysShowMore
  return (
    <Paper className={clsx(styles.container, { [className!]: !!className })}>
      {title && (
        <div className={styles.titleContainer}>
          <Text variant="heading" size="s" strength="default" tag="span">
            {title}
          </Text>
          {label && <p className={styles.label}>{label}</p>}
        </div>
      )}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Loading className={styles.tableLoading} />
        </div>
      ) : error ? (
        <Error className={styles.error} />
      ) : (
        <>
          <div className={styles.headers}>
            {columns.map(c => (
              <div
                key={c.title}
                className={clsx(styles.columnTitle, c.className)}
              >
                {c.title}
              </div>
            ))}
          </div>
          {data.slice(0, rowLimit).map((data: any, idx: number) => (
            <Row
              key={idx}
              onRowClick={onRowClick}
              data={data}
              renderRow={renderRow}
            />
          ))}
          {showMore && moreText && (
            <div onClick={onClickMore} className={styles.moreText}>
              {moreText}
            </div>
          )}
        </>
      )}
    </Paper>
  )
}

export default Table
