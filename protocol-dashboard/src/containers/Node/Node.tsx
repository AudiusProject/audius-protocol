import React from 'react'
import { RouteComponentProps } from 'react-router'
import { matchPath } from 'react-router-dom'
import NodeOverview from 'components/NodeOverview'
import { useDiscoveryProvider } from 'store/cache/discoveryProvider/hooks'
import { useContentNode } from 'store/cache/contentNode/hooks'
import { useAccount } from 'store/account/hooks'

import styles from './Node.module.css'
import Page from 'components/Page'
import { Status, Address, ServiceType } from 'types'
import { usePushRoute } from 'utils/effects'
import {
  SERVICES_DISCOVERY_PROVIDER_NODE,
  SERVICES_TITLE,
  SERVICES,
  NOT_FOUND
} from 'utils/routes'
import IndividualServiceApiCallsChart from 'components/IndividualServiceApiCallsChart'
import clsx from 'clsx'
import IndividualServiceUniqueUsersChart from 'components/IndividualServiceUniqueUsersChart'

const messages = {
  title: 'SERVICE',
  discovery: 'Discovery Node',
  content: 'Content Node'
}

type ContentNodeProps = { spID: number; accountWallet: Address | undefined }
const ContentNode: React.FC<ContentNodeProps> = ({
  spID,
  accountWallet
}: ContentNodeProps) => {
  const { node: contentNode, status } = useContentNode({ spID })

  if (status === Status.Failure) {
    return null
  }

  const isOwner = accountWallet === contentNode?.owner ?? false

  return (
    <NodeOverview
      spID={spID}
      serviceType={ServiceType.ContentNode}
      version={contentNode?.version}
      endpoint={contentNode?.endpoint}
      operatorWallet={contentNode?.owner}
      delegateOwnerWallet={contentNode?.delegateOwnerWallet}
      isOwner={isOwner}
      isDeregistered={contentNode?.isDeregistered}
      isLoading={status === Status.Loading}
    />
  )
}

type DiscoveryNodeProps = {
  spID: number
  accountWallet: Address | undefined
}
const DiscoveryNode: React.FC<DiscoveryNodeProps> = ({
  spID,
  accountWallet
}: DiscoveryNodeProps) => {
  const { node: discoveryNode, status } = useDiscoveryProvider({ spID })
  const pushRoute = usePushRoute()
  if (status === Status.Failure) {
    pushRoute(NOT_FOUND)
    return null
  }

  const isOwner = accountWallet === discoveryNode?.owner ?? false

  return (
    <>
      <div className={styles.section}>
        <NodeOverview
          spID={spID}
          serviceType={ServiceType.DiscoveryProvider}
          version={discoveryNode?.version}
          endpoint={discoveryNode?.endpoint}
          operatorWallet={discoveryNode?.owner}
          delegateOwnerWallet={discoveryNode?.delegateOwnerWallet}
          isOwner={isOwner}
          isDeregistered={discoveryNode?.isDeregistered}
          isLoading={status === Status.Loading}
        />
      </div>
      {discoveryNode ? (
        <div className={clsx(styles.section, styles.chart)}>
          <IndividualServiceApiCallsChart node={discoveryNode?.endpoint} />
          <IndividualServiceUniqueUsersChart node={discoveryNode?.endpoint} />
        </div>
      ) : null}
    </>
  )
}

type NodeProps = {} & RouteComponentProps<{ spID: string }>
const Node: React.FC<NodeProps> = (props: NodeProps) => {
  const {
    location: { pathname },
    match: { params }
  } = props
  const spID = parseInt(params.spID)
  const { wallet: accountWallet } = useAccount()

  const isDiscovery = !!matchPath(pathname, {
    path: SERVICES_DISCOVERY_PROVIDER_NODE
  })

  return (
    <Page
      title={messages.title}
      className={styles.container}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      {isDiscovery ? (
        <DiscoveryNode spID={spID} accountWallet={accountWallet} />
      ) : (
        <ContentNode spID={spID} accountWallet={accountWallet} />
      )}
    </Page>
  )
}

export default Node
