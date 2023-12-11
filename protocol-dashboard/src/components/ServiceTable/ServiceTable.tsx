import React from 'react'
import clsx from 'clsx'
import ReactCountryFlag from 'react-country-flag'
import { NodeService, ContentNode, DiscoveryProvider } from 'types'
import styles from './ServiceTable.module.css'
import Table from 'components/Table'
import Error from 'components/Error'
import { isMobile } from 'utils/mobile'
import { useIndividualNodeUptime } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { DataObject, TrackerMini } from 'components/TrackerChart'

type ServiceRow = {
  endpoint: string
  version: string
}

type OwnProps = {
  className?: string
  isLoading?: boolean
  title: string
  data: ServiceRow[]
  limit?: number
  moreText?: string
  onRowClick:
    | ((props: ContentNode) => void)
    | ((props: DiscoveryProvider) => void)
  onClickMore?: () => void
  alwaysShowMore?: boolean
}

type ServiceTableProps = OwnProps

const ServiceTable: React.FC<ServiceTableProps> = ({
  className,
  isLoading,
  title,
  moreText,
  limit,
  data,
  onRowClick,
  onClickMore,
  alwaysShowMore
}: ServiceTableProps) => {
  const columns = [
    { title: 'Service Endpoint', className: styles.colEndpoint },
    { title: 'Version', className: styles.colVersion },
    { title: 'Uptime', className: styles.colUptime }
  ]

  const renderRow = (data: NodeService) => {
    let error: boolean, uptimeData: DataObject[]
    const { uptime } = useIndividualNodeUptime(data.endpoint, Bucket.DAY)
    if (uptime === MetricError.ERROR) {
      error = true
      uptimeData = []
    } else if (uptime?.uptime_raw_data) {
      uptimeData = []
      const hoursToDisplay = isMobile() ? -7 : -9
      for (const up of Object.values(uptime.uptime_raw_data).slice(
        hoursToDisplay
      )) {
        uptimeData.push({
          // TODO add harmony and use harmony css vars
          color: up === 1 ? '#13c65a' : '#f9344c'
          // color: up === 1 ? 'var(--harmony-light-green)' : 'var(--harmony-red)',
        })
      }
    }

    return (
      <div className={styles.rowContainer}>
        <div className={clsx(styles.rowCol, styles.colEndpoint)}>
          <ReactCountryFlag
            className={styles.countryFlag}
            countryCode={data.country}
          />
          {data.endpoint}
        </div>
        <div className={clsx(styles.rowCol, styles.colVersion)}>
          {data.version ? data.version : <Error className={styles.error} />}
        </div>
        <div className={clsx(styles.rowCol, styles.colUptime)}>
          {error ? (
            <Error className={styles.error} />
          ) : (
            <TrackerMini data={uptimeData} />
          )}
        </div>
      </div>
    )
  }

  return (
    <Table
      title={title}
      isLoading={isLoading}
      className={clsx(styles.topAddressesTable, { [className!]: !!className })}
      columns={columns}
      data={data}
      limit={limit}
      renderRow={renderRow}
      onRowClick={onRowClick}
      onClickMore={onClickMore}
      moreText={moreText}
      alwaysShowMore={alwaysShowMore}
    />
  )
}

export default ServiceTable
