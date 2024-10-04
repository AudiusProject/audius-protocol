import type { PublicClient } from 'viem'

import { abi } from './abi'
import { REGISTRY_CONTRACT_ADDRESS } from './constants'

export class Registry {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? REGISTRY_CONTRACT_ADDRESS
  }

  getContract = ({ registryKey }: { registryKey: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getContract',
      args: [registryKey]
    })
}
