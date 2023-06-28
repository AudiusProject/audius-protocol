import type { StorageNodeSelectorService } from '@audius/sdk'
import { StorageNodeSelector } from '@audius/sdk'

import { auth } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

export let storageNodeSelector: StorageNodeSelectorService

export const getStorageNodeSelector = async () => {
  if (storageNodeSelector) return storageNodeSelector

  const discoveryNodeSelector = await discoveryNodeSelectorService.getInstance()
  storageNodeSelector = new StorageNodeSelector({ auth, discoveryNodeSelector })
  return storageNodeSelector
}
