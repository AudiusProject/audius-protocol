import type { SdkServicesConfig } from '../../../config/types'
import { Logger } from '../../Logger'

import type { SolanaClientConfigInternal } from './types'

export const getDefaultSolanaClientConfig = (
  servicesConfig: SdkServicesConfig
): SolanaClientConfigInternal => ({
  rpcEndpoints: [servicesConfig.solana.rpcEndpoint],
  logger: new Logger()
})
