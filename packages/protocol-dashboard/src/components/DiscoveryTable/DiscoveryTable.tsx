import React, { useCallback } from 'react'
import { useDiscoveryProviders } from 'store/cache/discoveryProvider/hooks'

import { DiscoveryProvider, Address, Status } from 'types'
import { SERVICES_DISCOVERY_PROVIDER, discoveryNodePage } from 'utils/routes'
import { usePushRoute } from 'utils/effects'

import ServiceTable from 'components/ServiceTable'

const messages = {
  title: 'Discovery Providers',
  viewMore: 'View All Discovery Providers'
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
    pushRoute(SERVICES_DISCOVERY_PROVIDER)
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
