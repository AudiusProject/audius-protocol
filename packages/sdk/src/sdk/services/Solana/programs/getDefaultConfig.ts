import type { SdkServicesConfig } from '../../../config/types'

import type { SolanaClientConfigInternal } from './types'

export const getDefaultSolanaClientConfig = (
  servicesConfig: SdkServicesConfig
): SolanaClientConfigInternal => ({
  rpcEndpoints: [servicesConfig.solana.rpcEndpoint]
})
