import type { PublicClient } from 'viem'

// import { abi } from './abi'
import { WORMHOLE_CLIENT_CONTRACT_ADDRESS } from './constants'

export class Wormhole {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? WORMHOLE_CLIENT_CONTRACT_ADDRESS
  }
}
