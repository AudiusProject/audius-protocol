import type { SdkServicesConfig } from '../../config/types'
import { Logger } from '../Logger'

import type { StorageNodeSelectorConfigInternal } from './types'

export const getDefaultStorageNodeSelectorConfig = (
  config: SdkServicesConfig
): StorageNodeSelectorConfigInternal => ({
  bootstrapNodes: config.network.storageNodes,
  endpoint: config.network.apiEndpoint,
  logger: new Logger()
})
