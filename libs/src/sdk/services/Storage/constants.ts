import { Logger } from '../Logger'
import { StorageNodeSelector } from '../StorageNodeSelector'
import { defaultStorageNodeSelectorConfig } from '../StorageNodeSelector/constants'
import type { StorageServiceConfigInternal } from './types'

export const defaultStorageServiceConfig: StorageServiceConfigInternal = {
  storageNodeSelector: new StorageNodeSelector(
    defaultStorageNodeSelectorConfig
  ),
  logger: new Logger()
}

export const MAX_TRACK_TRANSCODE_TIMEOUT = 3600000 // 1 hour
export const MAX_IMAGE_RESIZE_TIMEOUT_MS = 5 * 60_000 // 5 minutes
export const POLL_STATUS_INTERVAL = 3000 // 3s
