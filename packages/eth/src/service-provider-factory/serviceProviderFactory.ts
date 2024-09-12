import type { PublicClient } from 'viem'

import { abi } from './abi'
import { SERVICE_PROVIDER_FACTORY_CONTRACT_ADDRESS } from './constants'

export const getTotalServiceTypeProviders = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: SERVICE_PROVIDER_FACTORY_CONTRACT_ADDRESS,
    abi,
    functionName: 'getTotalServiceTypeProviders',
    args: [serviceType]
  })

export const getServiceEndpointInfo = (
  client: PublicClient,
  { serviceType, index }: { serviceType: `0x${string}`; index: bigint }
) =>
  client.readContract({
    address: SERVICE_PROVIDER_FACTORY_CONTRACT_ADDRESS,
    abi,
    functionName: 'getServiceEndpointInfo',
    args: [serviceType, index]
  })
