import type { Auth } from '../Auth'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'

export type StorageNodeSelectorService = {
  getSelectedNode: () => Promise<string | null>
}

export type StorageNode = {
  endpoint: string
  ownerDelegateWallet: string
}

export type StorageNodeSelectorConfig = {
  bootstrapNodes?: StorageNode[]
  auth: Auth
  discoveryNodeSelector: DiscoveryNodeSelectorService
}
