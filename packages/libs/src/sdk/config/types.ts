import type { DiscoveryNode, StorageNode } from '../services'

export type ServicesConfig = {
  minVersion: string
  discoveryNodes: DiscoveryNode[]
  storageNodes: StorageNode[]
  antiAbuseOracleNodes: {
    endpoints: string[]
    registeredAddresses: string[]
  }
  entityManagerContractAddress: string
  web3ProviderUrl: string
  identityServiceUrl: string
}
