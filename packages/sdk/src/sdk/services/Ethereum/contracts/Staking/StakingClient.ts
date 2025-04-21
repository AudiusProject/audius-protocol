import { Staking } from '@audius/eth'
import type { Hex, PublicClient } from 'viem'

import type { StakingConfig } from './types'

export class StakingClient {
  public readonly contractAddress: Hex

  private readonly publicClient: PublicClient

  constructor(config: StakingConfig) {
    this.contractAddress = config.address
    this.publicClient = config.ethPublicClient
  }

  token = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'token'
    })

  totalStaked = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'totalStaked'
    })

  supportsHistory = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'supportsHistory'
    })

  totalStakedFor = ({ account }: { account: `0x${string}` }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'totalStakedFor',
      args: [account]
    })

  totalStakedAt = ({ blockNumber }: { blockNumber: bigint }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'totalStakedAt',
      args: [blockNumber]
    })

  totalStakedForAt = ({
    account,
    blockNumber
  }: {
    account: `0x${string}`
    blockNumber: bigint
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'totalStakedForAt',
      args: [account, blockNumber]
    })

  isStaker = ({ account }: { account: `0x${string}` }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'isStaker',
      args: [account]
    })

  lastClaimedFor = ({ account }: { account: `0x${string}` }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'lastClaimedFor',
      args: [account]
    })

  getDelegateManagerAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'getDelegateManagerAddress'
    })

  getClaimsManagerAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'getClaimsManagerAddress'
    })

  getServiceProviderFactoryAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'getServiceProviderFactoryAddress'
    })

  getGovernanceAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: Staking.abi,
      functionName: 'getGovernanceAddress'
    })
}
