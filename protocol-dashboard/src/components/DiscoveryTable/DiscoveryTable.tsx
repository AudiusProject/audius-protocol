import React, { useCallback } from 'react'

import ServiceTable from 'components/ServiceTable'
import { useDiscoveryProviders } from 'store/cache/discoveryProvider/hooks'
import { Address, DiscoveryProvider, Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { NODES_DISCOVERY, discoveryNodePage } from 'utils/routes'

const messages = {
  title: 'Discovery Nodes',
  viewMore: 'View All Discovery Nodes'
}

type OwnProps = {
  className?: string
  limit?: number
  owner?: Address
  alwaysShowMore?: boolean
}

type DiscoveryTableProps = OwnProps
const DiscoveryTable: React.FC<DiscoveryTableProps> = ({
  className,
  limit,
  owner,
  alwaysShowMore
}: DiscoveryTableProps) => {
  const { nodes, status } = useDiscoveryProviders({ owner })
  const pushRoute = usePushRoute()

  const onClickMore = useCallback(() => {
    pushRoute(NODES_DISCOVERY)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: DiscoveryProvider) => {
      pushRoute(discoveryNodePage(row.spID))
    },
    [pushRoute]
  )

  return (
    <ServiceTable
      isLoading={status === Status.Loading}
      className={className}
      title={messages.title}
      data={nodes}
      limit={limit}
      onRowClick={onRowClick}
      onClickMore={limit ? onClickMore : undefined}
      moreText={limit ? messages.viewMore : undefined}
      alwaysShowMore={alwaysShowMore}
    />
  )
}

export default DiscoveryTable
