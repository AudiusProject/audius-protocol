import type { PublicClient } from 'viem'

import { abi } from './abi'
import { DELEGATE_MANAGER_CONTRACT_ADDRESS } from './constants'

export class ServiceProviderFactory {
  client: PublicClient
  address: `0x${string}`

  constructor(client: PublicClient, { address }: { address?: `0x${string}` }) {
    this.client = client
    this.address = address ?? DELEGATE_MANAGER_CONTRACT_ADDRESS
  }

  getIncreaseDelegatedStakeEvents = ({ address }: { address: `0x${string}` }) =>
    // IncreaseDelegatedStake
    this.client.getPastEvents({})

  getUndelegateStakeRequestEvaluatedEvents = ({
    address
  }: {
    address: `0x${string}`
  }) =>
    // UndelegateStakeRequestEvaluated
    this.client.getPastEvents({})

  getUndelegateStakeEvents = ({ address }: { address: `0x${string}` }) =>
    // UndelegateStakeRequested
    this.client.getPastEvents({})

  getUndelegateStakeCancelledEvents = ({
    address
  }: {
    address: `0x${string}`
  }) =>
    // UndelegateStakeRequestCancelled
    this.client.getPastEvents({})

  getDelegatorRemovedEvents = ({ address }: { address: `0x${string}` }) =>
    // DelegatorRemoved
    this.client.getPastEvents({})

  getClaimEvents = ({ address }: { address: `0x${string}` }) =>
    // Claim
    this.client.getPastEvents({})

  getSlashEvents = ({ address }: { address: `0x${string}` }) =>
    // Slash
    this.client.getPastEvents({})

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
