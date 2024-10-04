import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import type { SdkServicesConfig } from '../../../config/types'

import type { EthereumContractConfigInternal } from './types'

export const getDefaultEthereumClientConfig = (servicesConfig: {
  ethereum: SdkServicesConfig['ethereum']
}): EthereumContractConfigInternal => {
  return {
    rpcEndpoint: servicesConfig.ethereum.rpcEndpoint,
    addresses: servicesConfig.ethereum.addresses,
    client: createPublicClient({
      chain: mainnet,
      transport: http(servicesConfig.ethereum.rpcEndpoint)
    })
  }
}
