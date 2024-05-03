import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { StorageServiceConfigInternal } from './types'

export const defaultStorageServiceConfig: Record<
  Env,
  StorageServiceConfigInternal
> = {
  production: {
    logger: new Logger()
  },
  staging: {
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    logger: new Logger({ logLevel: 'debug' })
  }
}

export const MAX_TRACK_TRANSCODE_TIMEOUT = 3600000 // 1 hour
export const MAX_IMAGE_RESIZE_TIMEOUT_MS = 5 * 60_000 // 5 minutes
export const POLL_STATUS_INTERVAL = 3000 // 3s
