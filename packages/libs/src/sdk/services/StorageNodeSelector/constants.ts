import { productionConfig } from '../../config'
import { Logger } from '../Logger'

import type { StorageNodeSelectorConfigInternal } from './types'

export const defaultStorageNodeSelectorConfig: StorageNodeSelectorConfigInternal =
  {
    bootstrapNodes: productionConfig.storageNodes,
    logger: new Logger()
  }
