import React, { useCallback } from 'react'

import ServiceTable from 'components/ServiceTable'
import { useContentNodes } from 'store/cache/contentNode/hooks'
import { useDiscoveryProviders } from 'store/cache/discoveryProvider/hooks'
import { Address, NodeService, ServiceType, Status } from 'types'
import { usePushRoute } from 'utils/effects'
import { NODES_CONTENT, contentNodePage, discoveryNodePage } from 'utils/routes'

const messages = {
  title: 'Nodes',
  viewMore: 'View All Nodes'
}

type OwnProps = {
  className?: string
  limit?: number
  owner?: Address
  alwaysShowMore?: boolean
}

type NodeTableProps = OwnProps
const ContentTable: React.FC<NodeTableProps> = ({
  className,
  limit,
  owner,
  alwaysShowMore
}: NodeTableProps) => {
  const { nodes: cnNodes, status: cnStatus } = useContentNodes({ owner })
  const { nodes: dpNodes } = useDiscoveryProviders({ owner })
  const pushRoute = usePushRoute()
  const allNodes = [...cnNodes, ...dpNodes]

  const onClickMore = useCallback(() => {
    pushRoute(NODES_CONTENT)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: NodeService) => {
      if (row.type === ServiceType.ContentNode) {
        pushRoute(contentNodePage(row.spID))
      } else if (row.type === ServiceType.DiscoveryProvider) {
        // TODO: remove with dp deprecation
        pushRoute(discoveryNodePage(row.spID))
      }
    },
    [pushRoute]
  )

  return (
    <ServiceTable
      className={className}
      isLoading={cnStatus === Status.Loading}
      title={messages.title}
      data={allNodes}
      limit={limit}
      onRowClick={onRowClick}
      onClickMore={limit ? onClickMore : undefined}
      moreText={limit ? messages.viewMore : undefined}
      alwaysShowMore={alwaysShowMore}
    />
  )
}

export default ContentTable
