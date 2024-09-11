import type { SdkServicesConfig } from '../../../config/types'

import type { EthereumContractConfigInternal } from './types'

export const getDefaultEthereumClientConfig = (
  servicesConfig: SdkServicesConfig
): EthereumContractConfigInternal => ({
  rpcEndpoint: servicesConfig.ethereum.rpcEndpoint
})
