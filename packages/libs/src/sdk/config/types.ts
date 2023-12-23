import type { StorageNode } from '../services'

export type ServicesConfig = {
  minVersion: string
  discoveryNodes: string[]
  storageNodes: StorageNode[]
  antiAbuseOracleNodes: {
    endpoints: string[]
    addresses: string[]
  }
  entityManagerContractAddress: string
  web3ProviderUrl: string
  identityServiceUrl: string
}
