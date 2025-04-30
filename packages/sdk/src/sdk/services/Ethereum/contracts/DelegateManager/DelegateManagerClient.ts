import { DelegateManager } from '@audius/eth'
import type { GetContractEventsParameters, Hex, PublicClient } from 'viem'

import type { DelegateManagerConfig } from './types'

export class DelegateManagerClient {
  public readonly contractAddress: Hex

  private readonly publicClient: PublicClient

  constructor(config: DelegateManagerConfig) {
    this.contractAddress = config.address
    this.publicClient = config.ethPublicClient
  }

  getIncreaseDelegatedStakeEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider,
    increaseAmount
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
    increaseAmount?: bigint
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'IncreaseDelegatedStake'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider
    if (increaseAmount) args._increaseAmount = increaseAmount

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'IncreaseDelegatedStake',
      fromBlock,
      args
    })
  }

  getUndelegateStakeRequestedEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'UndelegateStakeRequested'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'UndelegateStakeRequested',
      fromBlock,
      args
    })
  }

  getUndelegateStakeRequestEvaluatedEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'UndelegateStakeRequestEvaluated'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'UndelegateStakeRequestEvaluated',
      fromBlock,
      args
    })
  }

  getUndelegateStakeRequestCancelledEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'UndelegateStakeRequestCancelled'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'UndelegateStakeRequestCancelled',
      fromBlock,
      args
    })
  }

  getRemoveDelegatorRequestedEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'RemoveDelegatorRequested'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'RemoveDelegatorRequested',
      fromBlock,
      args
    })
  }

  getRemoveDelegatorEvaluatedEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider,
    unstakedAmount
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
    unstakedAmount?: bigint
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'RemoveDelegatorRequestEvaluated'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider
    if (unstakedAmount) args._unstakedAmount = unstakedAmount

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'RemoveDelegatorRequestEvaluated',
      fromBlock,
      args
    })
  }

  getRemoveDelegatorCancelledEvents = ({
    fromBlock = BigInt(0),
    delegator,
    serviceProvider
  }: {
    fromBlock: bigint
    delegator?: `0x${string}`
    serviceProvider?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'RemoveDelegatorRequestCancelled'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'RemoveDelegatorRequestCancelled',
      fromBlock,
      args
    })
  }

  getClaimEvents = ({
    fromBlock = BigInt(0),
    claimer
  }: {
    fromBlock: bigint
    claimer?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'Claim'
    >['args'] = {}

    if (claimer) args._claimer = claimer

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'Claim',
      fromBlock,
      args
    })
  }

  getSlashEvents = ({
    fromBlock = BigInt(0),
    target
  }: {
    fromBlock: bigint
    target?: `0x${string}`
  }) => {
    const args: GetContractEventsParameters<
      typeof DelegateManager.abi,
      'Slash'
    >['args'] = {}

    if (target) args._target = target

    return this.publicClient.getContractEvents({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      eventName: 'Slash',
      fromBlock,
      args
    })
  }

  getDelegatorsList = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getDelegatorsList',
      args: [serviceProviderAddress]
    })

  getTotalDelegatedToServiceProvider = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getTotalDelegatedToServiceProvider',
      args: [serviceProviderAddress]
    })

  getTotalLockedDelegationForServiceProvider = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getTotalLockedDelegationForServiceProvider',
      args: [serviceProviderAddress]
    })

  getTotalDelegatorStake = ({
    delegatorAddress
  }: {
    delegatorAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getTotalDelegatorStake',
      args: [delegatorAddress]
    })

  getDelegatorStakeForServiceProvider = ({
    delegatorAddress,
    serviceProviderAddress
  }: {
    delegatorAddress: `0x${string}`
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getDelegatorStakeForServiceProvider',
      args: [delegatorAddress, serviceProviderAddress]
    })

  getPendingRemoveDelegatorRequest = ({
    delegatorAddress,
    serviceProviderAddress
  }: {
    delegatorAddress: `0x${string}`
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getPendingRemoveDelegatorRequest',
      args: [serviceProviderAddress, delegatorAddress]
    })

  getPendingUndelegateRequest = ({
    delegatorAddress
  }: {
    delegatorAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getPendingUndelegateRequest',
      args: [delegatorAddress]
    })

  getUndelegateLockupDuration = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getUndelegateLockupDuration'
    })

  getMaxDelegators = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getMaxDelegators'
    })

  getMinDelegationAmount = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getMinDelegationAmount'
    })

  getRemoveDelegatorLockupDuration = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getRemoveDelegatorLockupDuration'
    })

  getRemoveDelegatorEvalDuration = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getRemoveDelegatorEvalDuration'
    })

  getGovernanceAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getGovernanceAddress'
    })

  getServiceProviderFactoryAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getServiceProviderFactoryAddress'
    })

  getClaimsManagerAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getClaimsManagerAddress'
    })

  getStakingAddress = () =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getStakingAddress'
    })

  getSPMinDelegationAmount = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.publicClient.readContract({
      address: this.contractAddress,
      abi: DelegateManager.abi,
      functionName: 'getSPMinDelegationAmount',
      args: [serviceProviderAddress]
    })
}
