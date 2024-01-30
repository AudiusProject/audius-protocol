import { useMatch, useParams } from 'react-router-dom'
import NodeOverview from 'components/NodeOverview'
import {
  useDiscoveryProvider,
  useDiscoveryProviders
} from 'store/cache/discoveryProvider/hooks'
import { useContentNode, useContentNodes } from 'store/cache/contentNode/hooks'
import { useAccount } from 'store/account/hooks'

import desktopStyles from './Node.module.css'
import mobileStyles from './NodeMobile.module.css'
import { createStyles } from 'utils/mobile'
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
import IndividualNodeUptimeChart from 'components/IndividualNodeUptimeChart'

const styles = createStyles({ desktopStyles, mobileStyles })

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
    <>
      <div className={styles.section}>
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
      </div>
      {contentNode ? (
        <div className={clsx(styles.section, styles.chart)}>
          <IndividualNodeUptimeChart nodeType={ServiceType.ContentNode} node={contentNode.endpoint} />
        </div>
      ) : null}
    </>
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
        <>
          <div className={clsx(styles.section, styles.chart)}>
            <IndividualServiceApiCallsChart node={discoveryNode?.endpoint} />
            <IndividualServiceUniqueUsersChart node={discoveryNode?.endpoint} />
          </div>
          <div className={clsx(styles.section, styles.chart)}>
            <IndividualNodeUptimeChart nodeType={ServiceType.DiscoveryProvider} node={discoveryNode.endpoint} />
          </div>
        </>
      ) : null}
    </>
  )
}

const Node = () => {
  const { spID: spIDParam } = useParams<{ spID: string }>()
  const spID = parseInt(spIDParam, 10)
  const { wallet: accountWallet } = useAccount()
  const isDiscovery = !!useMatch(SERVICES_DISCOVERY_PROVIDER_NODE)

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
