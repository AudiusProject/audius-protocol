import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '../../config'
import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { StorageNodeSelectorConfigInternal } from './types'

export const defaultStorageNodeSelectorConfig: Record<
  Env,
  StorageNodeSelectorConfigInternal
> = {
  production: {
    bootstrapNodes: productionConfig.storageNodes,
    logger: new Logger()
  },
  staging: {
    bootstrapNodes: stagingConfig.storageNodes,
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    bootstrapNodes: developmentConfig.storageNodes,
    logger: new Logger({ logLevel: 'debug' })
  }
}
