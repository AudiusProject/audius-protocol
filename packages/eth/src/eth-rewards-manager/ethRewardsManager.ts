import type { PublicClient } from 'viem'

import { abi } from './abi'
import { ETH_REWARDS_MANAGER_CONTRACT_ADDRESS } from './constants'

export class EthRewardsManager {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? ETH_REWARDS_MANAGER_CONTRACT_ADDRESS
  }

  getAntiAbuseOracleAddresses = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getAntiAbuseOracleAddresses'
    })
}
