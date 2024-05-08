import type { SdkServicesConfig } from '../../config/types'
import { Logger } from '../Logger'

import type { StorageServiceConfigInternal } from './types'

export const getDefaultStorageServiceConfig = (
  _config: SdkServicesConfig
): StorageServiceConfigInternal => ({
  logger: new Logger()
})
