import type { SdkServicesConfig } from '../../../config/types'

import type { EthereumContractConfigInternal } from './types'

export const getDefaultEthereumClientConfig = (servicesConfig: {
  ethereum: SdkServicesConfig['ethereum']
}): EthereumContractConfigInternal => ({
  rpcEndpoint: servicesConfig.ethereum.rpcEndpoint
})
