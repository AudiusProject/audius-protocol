import React from 'react'
import clsx from 'clsx'
import { NodeService, ContentNode, DiscoveryProvider } from 'types'
import styles from './ServiceTable.module.css'
import Table from 'components/Table'
import Error from 'components/Error'

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
    { title: 'Version', className: styles.colVersion }
  ]

  const renderRow = (data: NodeService) => {
    return (
      <div className={styles.rowContainer}>
        <div className={clsx(styles.rowCol, styles.colEndpoint)}>
          {data.endpoint}
        </div>
        <div className={clsx(styles.rowCol, styles.colVersion)}>
          {data.version ? data.version : <Error className={styles.error} />}
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
