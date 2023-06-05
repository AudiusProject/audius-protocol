import { Auth } from '../Auth'
import { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'
import type { StorageNodeSelectorConfig } from './types'

export const defaultStorageNodeSelectorConfig: StorageNodeSelectorConfig = {
  bootstrapNodes: [],
  auth: new Auth(),
  discoveryNodeSelector: new DiscoveryNodeSelector()
}
