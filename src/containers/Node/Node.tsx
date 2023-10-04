import React from 'react'
import { RouteComponentProps } from 'react-router'
import { matchPath } from 'react-router-dom'
import NodeOverview from '../../components/NodeOverview'
import { useDiscoveryProvider } from '../../store/cache/discoveryProvider/hooks'
import { useContentNode } from '../../store/cache/contentNode/hooks'
import { useAccount } from '../../store/account/hooks'

import styles from './Node.module.css'
import Page from '../../components/Page'
import { Status, Address, ServiceType } from '../../types'
import { usePushRoute } from '../../utils/effects'
import {
  SERVICES_DISCOVERY_PROVIDER_NODE,
  SERVICES_TITLE,
  SERVICES,
  NOT_FOUND
} from '../../utils/routes'

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
  } else if (status === Status.Loading) {
    return null
  }

  // TODO: compare owner with the current user
  const isOwner = accountWallet === contentNode!.owner

  return (
    <NodeOverview
      spID={spID}
      serviceType={ServiceType.ContentNode}
      version={contentNode!.version}
      endpoint={contentNode!.endpoint}
      operatorWallet={contentNode!.owner}
      delegateOwnerWallet={contentNode!.delegateOwnerWallet}
      isOwner={isOwner}
      isDeregistered={contentNode!.isDeregistered}
    />
  )
}

type DiscoveryProviderProps = {
  spID: number
  accountWallet: Address | undefined
}
const DiscoveryProvider: React.FC<DiscoveryProviderProps> = ({
  spID,
  accountWallet
}: DiscoveryProviderProps) => {
  const { node: discoveryProvider, status } = useDiscoveryProvider({ spID })
  const pushRoute = usePushRoute()
  if (status === Status.Failure) {
    pushRoute(NOT_FOUND)
    return null
  } else if (status === Status.Loading) {
    return null
  }

  const isOwner = accountWallet === discoveryProvider!.owner

  return (
    <NodeOverview
      spID={spID}
      serviceType={ServiceType.DiscoveryProvider}
      version={discoveryProvider!.version}
      endpoint={discoveryProvider!.endpoint}
      operatorWallet={discoveryProvider!.owner}
      delegateOwnerWallet={discoveryProvider!.delegateOwnerWallet}
      isOwner={isOwner}
      isDeregistered={discoveryProvider!.isDeregistered}
    />
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
        <DiscoveryProvider spID={spID} accountWallet={accountWallet} />
      ) : (
        <ContentNode spID={spID} accountWallet={accountWallet} />
      )}
    </Page>
  )
}

export default Node
