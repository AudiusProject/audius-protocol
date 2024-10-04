import type { PublicClient } from 'viem'

import { abi } from './abi'
import { SERVICE_PROVIDER_FACTORY_CONTRACT_ADDRESS } from './constants'

export class ServiceProviderFactory {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? SERVICE_PROVIDER_FACTORY_CONTRACT_ADDRESS
  }

  getTotalServiceTypeProviders = ({
    serviceType
  }: {
    serviceType: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getTotalServiceTypeProviders',
      args: [serviceType]
    })

  getServiceEndpointInfo = ({
    serviceType,
    index
  }: {
    serviceType: `0x${string}`
    index: bigint
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getServiceEndpointInfo',
      args: [serviceType, index]
    })
}
