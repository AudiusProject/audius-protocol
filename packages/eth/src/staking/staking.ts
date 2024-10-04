import type { PublicClient } from 'viem'

import { abi } from './abi'
import { STAKING_CONTRACT_ADDRESS } from './constants'

export class Staking {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? STAKING_CONTRACT_ADDRESS
  }

  token = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'token'
    })

  totalStaked = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'totalStaked'
    })

  supportsHistory = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'supportsHistory'
    })

  totalStakedFor = ({ account }: { account: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'totalStakedFor',
      args: [account]
    })

  totalStakedAt = ({ blockNumber }: { blockNumber: bigint }) =>
    this.client.readContract({
      address: this.address,
      abi,
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
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'totalStakedForAt',
      args: [account, blockNumber]
    })

  isStaker = ({ account }: { account: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'isStaker',
      args: [account]
    })

  lastClaimedFor = ({ account }: { account: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'lastClaimedFor',
      args: [account]
    })

  getDelegateManagerAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getDelegateManagerAddress'
    })

  getClaimsManagerAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getClaimsManagerAddress'
    })

  getServiceProviderFactoryAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getServiceProviderFactoryAddress'
    })

  getGovernanceAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getGovernanceAddress'
    })
}
