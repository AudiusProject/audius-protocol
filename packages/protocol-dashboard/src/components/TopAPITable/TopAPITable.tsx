import React from 'react'

import { IconCrown } from '@audius/stems'
import clsx from 'clsx'

import Table from 'components/Table'
import { useTopApps } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { formatNumberCommas } from 'utils/format'
import { useIsMobile } from 'utils/hooks'

import styles from './TopAPITable.module.css'

const messages = {
  title: 'Top API Apps by Total Requests',
  rank: 'Rank',
  totalReq: 'Total Requests'
}

export type APIAppRequests = {
  rank: number
  name: string
  totalRequests: number
}

type OwnProps = {
  className?: string
  limit?: number
  alwaysShowMore?: boolean
}

const CROWN_RANK = 10

type TopAPITableProps = OwnProps

const MIN_API_REQUEST_COUNT = 100
const filterCount = (name: string, count: number): boolean =>
  count >= MIN_API_REQUEST_COUNT

const TopAPITable: React.FC<TopAPITableProps> = ({
  className,
  alwaysShowMore
}: TopAPITableProps) => {
  const isMobile = useIsMobile()
  const { topApps } = useTopApps(Bucket.MONTH, undefined, filterCount)
  let error = false
  let displayData:
    | { name: string; totalRequests: number; rank: number }[]
    | null = null
  if (topApps === MetricError.ERROR) {
    error = true
    displayData = []
  } else if (topApps) {
    const data = Object.keys(topApps).reduce(
      (apps: { name: string; totalRequests: number }[], name: string) => {
        apps.push({ name, totalRequests: topApps[name] })
        return apps
      },
      []
    )
    data.sort((a, b) => b.totalRequests - a.totalRequests)
    displayData = data.map((nameCount, idx) => ({
      ...nameCount,
      rank: idx + 1
    }))
  }

  const columns = [
    { title: messages.rank, className: styles.colRank },
    { title: messages.totalReq, className: styles.colTotalReq }
  ]

  const renderRow = (data: APIAppRequests) => {
    return (
      <div className={styles.rowContainer}>
        <div className={styles.rankName}>
          <div className={clsx(styles.rowCol, styles.colNum)}>
            {data.rank <= CROWN_RANK && <IconCrown className={styles.crown} />}
            {data.rank}
          </div>
          <div className={clsx(styles.rowCol, styles.colName)}>{data.name}</div>
        </div>
        <div className={clsx(styles.rowCol, styles.colTotalReq)}>
          {formatNumberCommas(data.totalRequests.toString())}
        </div>
      </div>
    )
  }

  const isLoading = displayData === null
  const onRowClick = () => {}
  const onClickMore = () => {}
  return (
    <Table
      title={messages.title}
      isLoading={isLoading}
      className={clsx(styles.topAddressesTable, {
        [className!]: !!className,
        [styles.mobile]: isMobile
      })}
      columns={columns}
      data={displayData || []}
      renderRow={renderRow}
      onRowClick={onRowClick}
      onClickMore={onClickMore}
      alwaysShowMore={alwaysShowMore}
      error={error}
    />
  )
}

export default TopAPITable
