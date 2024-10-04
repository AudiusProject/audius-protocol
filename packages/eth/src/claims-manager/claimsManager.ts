import type { PublicClient } from 'viem'

import { abi } from './abi'
import { CLAIMS_MANAGER_CONTRACT_ADDRESS } from './constants'

export class ClaimsManager {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? CLAIMS_MANAGER_CONTRACT_ADDRESS
  }

  // Get the duration of a funding round in blocks
  getFundingRoundBlockDiff = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getFundingRoundBlockDiff'
    })

  // Get the last block where a funding round was initiated
  getLastFundedBlock = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getLastFundedBlock'
    })

  // Get the amount funded per round in wei
  getFundsPerRound = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getFundsPerRound'
    })

  // total amount claimed in the current round
  getTotalClaimedInRound = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getTotalClaimedInRound'
    })

  // Get the Governance address
  getGovernanceAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getGovernanceAddress'
    })

  // Get the ServiceProviderFactory address
  getServiceProviderFactoryAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getServiceProviderFactoryAddress'
    })

  // Get the DelegateManager address
  getDelegateManagerAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getDelegateManagerAddress'
    })

  // Get the Staking address
  getStakingAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getStakingAddress'
    })

  claimPending = ({ address }: { address: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'claimPending',
      args: [address]
    })
}
