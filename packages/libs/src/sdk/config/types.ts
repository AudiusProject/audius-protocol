import type { DiscoveryNode, StorageNode } from '../services'

export type ContractBootstrapConfig = {
  minVersion: string
  discoveryNodes: DiscoveryNode[]
  storageNodes: StorageNode[]
  antiAbuseOracleNodeWallets: string[]
}
