import React, { useCallback } from 'react'
import { usePushRoute } from 'utils/effects'

import { CreatorNode, Address, Status } from 'types'
import { SERVICES_CREATOR, creatorNodePage } from 'utils/routes'

import ServiceTable from 'components/ServiceTable'
import { useCreatorNodes } from 'store/cache/creatorNode/hooks'

const messages = {
  title: 'Creator Nodes',
  viewMore: 'View All Creator Nodes'
}

type OwnProps = {
  className?: string
  limit?: number
  owner?: Address
  alwaysShowMore?: boolean
}

type CreatorTableProps = OwnProps
const CreatorTable: React.FC<CreatorTableProps> = ({
  className,
  limit,
  owner,
  alwaysShowMore
}: CreatorTableProps) => {
  const { nodes, status } = useCreatorNodes({ owner })
  const pushRoute = usePushRoute()

  const onClickMore = useCallback(() => {
    pushRoute(SERVICES_CREATOR)
  }, [pushRoute])

  const onRowClick = useCallback(
    (row: CreatorNode) => {
      pushRoute(creatorNodePage(row.spID))
    },
    [pushRoute]
  )

  return (
    <ServiceTable
      className={className}
      isLoading={status === Status.Loading}
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

export default CreatorTable
