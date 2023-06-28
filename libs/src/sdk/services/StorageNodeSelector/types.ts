import type { Auth } from '../Auth'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'

export type StorageNodeSelectorService = {
  getSelectedNode: () => Promise<string | null>
  getNodes: (cid: string) => string[]
}

export type StorageNode = {
  endpoint: string
  delegateOwnerWallet: string
}

export type StorageNodeSelectorConfig = {
  bootstrapNodes?: StorageNode[]
  auth: Auth
  discoveryNodeSelector: DiscoveryNodeSelectorService
}
