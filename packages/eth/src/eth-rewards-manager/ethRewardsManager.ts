import type { PublicClient } from 'viem'

import { abi } from './abi'
import { ETH_REWARDS_MANAGER_CONTRACT_ADDRESS } from './constants'

export const getAntiAbuseOracleAddresses = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: ETH_REWARDS_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getAntiAbuseOracleAddresses'
  })
