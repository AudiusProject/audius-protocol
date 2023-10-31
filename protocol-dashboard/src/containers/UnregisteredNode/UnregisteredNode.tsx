import { useMatch, useLocation } from 'react-router-dom'
import { useAccount } from 'store/account/hooks'

import styles from './UnregisteredNode.module.css'
import Page from 'components/Page'
import { ServiceType } from 'types'
import {
  SERVICES_UNREGISTERED_DISCOVERY_NODE,
  SERVICES_TITLE,
  SERVICES
} from 'utils/routes'
import NodeOverview from 'components/NodeOverview'

const messages = {
  title: 'UNREGISTERED SERVICE'
}

const UnregisteredNode = () => {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const endpoint = query.get('endpoint')
  const { wallet: accountWallet } = useAccount()
  const isDiscovery = !!useMatch(SERVICES_UNREGISTERED_DISCOVERY_NODE)

  return (
    <Page
      title={messages.title}
      className={styles.container}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      {isDiscovery ? (
        <NodeOverview
          isUnregistered={true}
          endpoint={endpoint}
          serviceType={ServiceType.DiscoveryProvider}
          operatorWallet={accountWallet}
        />
      ) : (
        <NodeOverview
          isUnregistered={true}
          endpoint={endpoint}
          serviceType={ServiceType.ContentNode}
          operatorWallet={accountWallet}
        />
      )}
    </Page>
  )
}

export default UnregisteredNode
