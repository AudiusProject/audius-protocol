import type { Maybe } from '@audius/common'
import type { StorageNodeSelectorService } from '@audius/sdk'
import { StorageNodeSelector } from '@audius/sdk'

import { auth } from './auth'
import { bootstrapNodes } from './bootstrapStorageNodes'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

let storageNodeSelectorPromise: Maybe<Promise<StorageNodeSelectorService>>

const makeStorageNodeSelector = async () => {
  const discoveryNodeSelector = await discoveryNodeSelectorService.getInstance()
  return new StorageNodeSelector({
    auth,
    discoveryNodeSelector,
    bootstrapNodes
  })
}

export const getStorageNodeSelector = async () => {
  if (!storageNodeSelectorPromise) {
    storageNodeSelectorPromise = makeStorageNodeSelector()
  }
  return await storageNodeSelectorPromise
}
