import type { SdkServicesConfig } from '../../config/types'
import { Logger } from '../Logger'

import type { EntityManagerConfigInternal } from './types'

export const getDefaultEntityManagerConfig = (
  config: SdkServicesConfig
): EntityManagerConfigInternal => ({
  contractAddress: config.acdc.entityManagerContractAddress,
  chainId: config.acdc.chainId,
  endpoint: config.network.apiEndpoint,
  logger: new Logger()
})
