import type { PublicClient } from 'viem'
import type { GetContractEventsParameters } from 'viem/_types/actions/public/getContractEvents'

import { abi } from './abi'
import { DELEGATE_MANAGER_CONTRACT_ADDRESS } from './constants'

export class DelegateManager {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? DELEGATE_MANAGER_CONTRACT_ADDRESS
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
      typeof abi,
      'IncreaseDelegatedStake'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider
    if (increaseAmount) args._increaseAmount = increaseAmount

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'UndelegateStakeRequested'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'UndelegateStakeRequestEvaluated'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'UndelegateStakeRequestCancelled'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'RemoveDelegatorRequested'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'RemoveDelegatorRequestEvaluated'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider
    if (unstakedAmount) args._unstakedAmount = unstakedAmount

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
      typeof abi,
      'RemoveDelegatorRequestCancelled'
    >['args'] = {}

    if (delegator) args._delegator = delegator
    if (serviceProvider) args._serviceProvider = serviceProvider

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
    const args: GetContractEventsParameters<typeof abi, 'Claim'>['args'] = {}

    if (claimer) args._claimer = claimer

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
    const args: GetContractEventsParameters<typeof abi, 'Slash'>['args'] = {}

    if (target) args._target = target

    return this.client.getContractEvents({
      address: this.address,
      abi,
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
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getDelegatorsList',
      args: [serviceProviderAddress]
    })

  getTotalDelegatedToServiceProvider = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getTotalDelegatedToServiceProvider',
      args: [serviceProviderAddress]
    })

  getTotalLockedDelegationForServiceProvider = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getTotalLockedDelegationForServiceProvider',
      args: [serviceProviderAddress]
    })

  getTotalDelegatorStake = ({
    delegatorAddress
  }: {
    delegatorAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
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
    this.client.readContract({
      address: this.address,
      abi,
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
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getPendingRemoveDelegatorRequest',
      args: [serviceProviderAddress, delegatorAddress]
    })

  getPendingUndelegateRequest = ({
    delegatorAddress
  }: {
    delegatorAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getPendingUndelegateRequest',
      args: [delegatorAddress]
    })

  getUndelegateLockupDuration = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getUndelegateLockupDuration'
    })

  getMaxDelegators = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getMaxDelegators'
    })

  getMinDelegationAmount = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getMinDelegationAmount'
    })

  getRemoveDelegatorLockupDuration = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getRemoveDelegatorLockupDuration'
    })

  getRemoveDelegatorEvalDuration = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getRemoveDelegatorEvalDuration'
    })

  getGovernanceAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getGovernanceAddress'
    })

  getServiceProviderFactoryAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getServiceProviderFactoryAddress'
    })

  getClaimsManagerAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getClaimsManagerAddress'
    })

  getStakingAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getStakingAddress'
    })

  getSPMinDelegationAmount = ({
    serviceProviderAddress
  }: {
    serviceProviderAddress: `0x${string}`
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getSPMinDelegationAmount',
      args: [serviceProviderAddress]
    })
}
