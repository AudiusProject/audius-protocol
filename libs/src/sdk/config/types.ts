import type { StorageNode } from '../services'

export type ServicesConfig = {
  minVersion: string
  discoveryNodes: string[]
  storageNodes: StorageNode[]
  entityManagerContractAddress: string
  web3ProviderUrl: string
  identityServiceUrl: string
}
