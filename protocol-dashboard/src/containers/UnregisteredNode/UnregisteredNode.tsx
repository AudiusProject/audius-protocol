// import { useQuery } from '@tanstack/react-query'
import { useMatch, useLocation } from 'react-router-dom'
import { useAccount } from 'store/account/hooks'

import styles from './UnregisteredNode.module.css'
import Page from 'components/Page'
import { Address } from 'types'
import {
  SERVICES_UNREGISTERED_DISCOVERY_NODE,
  SERVICES_TITLE,
  SERVICES
} from 'utils/routes'

const messages = {
  title: 'UNREGISTERED SERVICE',
  discovery: 'Discovery Node',
  content: 'Content Node'
}

type UnregisteredContentNodeProps = {
  endpoint: string
  accountWallet: Address | undefined
}
const UnregisteredContentNode = ({
  endpoint,
  accountWallet
}: UnregisteredContentNodeProps) => {
  // const isOwner = accountWallet === discoveryProvider!.owner

  // const { status, data, error } = useQuery({
  //   queryKey: ['health', { endpoint }],
  //   queryFn: async () => {
  //     const response = await fetch(`${endpoint}/health_check`)
  //     if (!response.ok) {
  //       throw new Error(
  //         `Failed fetching health check from ${endpoint}: ${response.status} ${response.statusText}`
  //       )
  //     }
  //     return response.json()
  //   }
  // })

  // if (status === 'pending') {
  //   return <span>Loading...</span>
  // }

  // if (status === 'error') {
  //   return <span>Error: {error.message}</span>
  // }

  return (
    <>
      Health UI and Registration UI Coming Soon
      {/* {JSON.stringify(data)} */}
    </>
  )
}

type UnregisteredDiscoveryProviderProps = {
  endpoint: string
  accountWallet: Address | undefined
}
const UnregisteredDiscoveryProvider = ({
  endpoint,
  accountWallet
}: UnregisteredDiscoveryProviderProps) => {
  // const isOwner = accountWallet === discoveryProvider!.owner

  return <>Health UI and Registration UI Coming Soon</>
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
        <UnregisteredDiscoveryProvider
          endpoint={endpoint}
          accountWallet={accountWallet}
        />
      ) : (
        <UnregisteredContentNode
          endpoint={endpoint}
          accountWallet={accountWallet}
        />
      )}
    </Page>
  )
}

export default UnregisteredNode
