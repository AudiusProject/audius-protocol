import { AudiusClient } from './AudiusClient'
import BN from 'bn.js'
import {
  Address,
  Amount,
  BlockNumber,
  TxReceipt,
  Permission,
  BigNumber
} from 'types'

export type DelegateStakeResponse = {
  txReceipt: TxReceipt
  tokenApproveReceipt: { txReceipt: TxReceipt }
  delegator: Address
  serviceProvider: Address
  increaseAmount: BigNumber
}

export type UndelegateStakeResponse = {
  delegator: Address
  serviceProvider: Address
  decreaseAmount: BigNumber
}

export type RemoveDelegatorResponse = {
  delegator: Address
  serviceProvider: Address
  unstakedAmount: BigNumber
}

export type GetDelegatorsListResponse = Array<Address>

export type GetPendingUndelegateRequestResponse = {
  amount: BigNumber
  lockupExpiryBlock: BlockNumber
  target: Address
}

export type IncreaseDelegateStakeEvent = {
  blockNumber: number
  delegator: Address
  increaseAmount: BN
  serviceProvider: Address
}

export type DecreaseDelegateStakeEvent = {
  blockNumber: number
  delegator: Address
  decreaseAmount: BN
  serviceProvider: Address
}

export default class Delegate {
  aud: AudiusClient

  constructor(aud: AudiusClient) {
    this.aud = aud
  }

  getContract() {
    return this.aud.libs.ethContracts.DelegateManagerClient
  }

  /* -------------------- Delegate Manager Client Read -------------------- */

  async getDelegatorsList(
    serviceProvider: Address
  ): Promise<GetDelegatorsListResponse> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDelegatorsList(serviceProvider)
    return info
  }

  async getTotalDelegatedToServiceProvider(
    serviceProvider: Address
  ): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getTotalDelegatedToServiceProvider(
      serviceProvider
    )
    return info
  }

  async getTotalDelegatorStake(delegator: Address): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getTotalDelegatorStake(delegator)
    return info
  }

  async getTotalLockedDelegationForServiceProvider(
    serviceProvider: Address
  ): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getTotalLockedDelegationForServiceProvider(
      serviceProvider
    )
    return info
  }

  async getDelegatorStakeForServiceProvider(
    delegator: Address,
    serviceProvider: Address
  ): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDelegatorStakeForServiceProvider(
      delegator,
      serviceProvider
    )
    return info
  }

  async getPendingUndelegateRequest(
    delegator: Address
  ): Promise<GetPendingUndelegateRequestResponse> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getPendingUndelegateRequest(delegator)
    return info
  }

  async getPendingRemoveDelegatorRequest(
    serviceProvider: Address,
    delegator: Address
  ): Promise<{ lockupExpiryBlock: BlockNumber }> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getPendingRemoveDelegatorRequest(
      serviceProvider,
      delegator
    )
    return info
  }

  async getUndelegateLockupDuration(): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getUndelegateLockupDuration()
    return info
  }

  async getMaxDelegators(): Promise<number> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getMaxDelegators()
    return info
  }

  async getMinDelegationAmount(): Promise<BigNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getMinDelegationAmount()
    return info
  }

  async getRemoveDelegatorLockupDuration(): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getRemoveDelegatorLockupDuration()
    return info
  }

  async getRemoveDelegatorEvalDuration(): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getRemoveDelegatorEvalDuration()
    return info
  }

  async getGovernanceAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getGovernanceAddress()
    return info
  }

  async getServiceProviderFactoryAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getServiceProviderFactoryAddress()
    return info
  }

  async getClaimsManagerAddress(): Promise<Address> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getClaimsManagerAddress()
    return info
  }

  async getIncreaseDelegateStakeEvents(
    delegator: Address
  ): Promise<Array<IncreaseDelegateStakeEvent>> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getIncreaseDelegateStakeEvents({
      delegator
    })
    return info.map((i: any) => ({ ...i, direction: 'SENT' }))
  }

  async getReceiveDelegationIncreaseEvents(
    serviceProvider: Address
  ): Promise<Array<IncreaseDelegateStakeEvent>> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getIncreaseDelegateStakeEvents({
      serviceProvider
    })
    return info.map((i: any) => ({ ...i, direction: 'RECEIVED' }))
  }

  /* Can filter either by delegator or SP */
  async getDecreaseDelegateStakeEvents({
    delegator,
    serviceProvider
  }: {
    delegator?: Address
    serviceProvider?: Address
  }): Promise<Array<DecreaseDelegateStakeEvent>> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDecreaseDelegateStakeEvents({
      delegator,
      serviceProvider
    })
    return info.map((event: any) => ({
      ...event,
      decreaseDelegation: true,
      stage: 'evaluated',
      userType: delegator ? 'Delegator' : 'ServiceProvider'
    }))
  }

  /* Can filter either by delegator or SP */
  async getUndelegateStakeRequestedEvents({
    serviceProvider,
    delegator
  }: {
    serviceProvider?: Address
    delegator?: Address
  }): Promise<Array<any>> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getUndelegateStakeRequestedEvents({
      serviceProvider,
      delegator
    })
    return info.map((event: any) => ({
      ...event,
      decreaseDelegation: true,
      stage: 'requested',
      userType: delegator ? 'Delegator' : 'ServiceProvider'
    }))
  }

  /* Can filter either by delegator or SP */
  async getUndelegateStakeCancelledEvents({
    serviceProvider,
    delegator
  }: {
    serviceProvider?: Address
    delegator?: Address
  }): Promise<Array<any>> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getUndelegateStakeCancelledEvents({
      serviceProvider,
      delegator
    })
    return info.map((event: any) => ({
      ...event,
      decreaseDelegation: true,
      stage: 'cancelled',
      userType: delegator ? 'Delegator' : 'ServiceProvider'
    }))
  }

  async getClaimEvents(
    claimer: Address
  ): Promise<
    Array<{
      blockNumber: number
      claimer: Address
      rewards: BN
      newTotal: BN
    }>
  > {
    await this.aud.hasPermissions()
    const info = await this.getContract().getClaimEvents({
      claimer
    })
    return info
  }

  async getSlashEvents(
    target: Address
  ): Promise<
    Array<{
      blockNumber: number
      target: Address
      amount: BN
      newTotal: BN
    }>
  > {
    await this.aud.hasPermissions()
    const info = await this.getContract().getSlashEvents({
      target
    })
    return info
  }

  async getDelegatorRemovedEvents(
    delegator: Address
  ): Promise<
    Array<{
      blockNumber: number
      serviceProvider: Address
      delegator: Address
      unstakedAmount: BN
    }>
  > {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDecreaseDelegateStakeEvents({
      delegator
    })
    return info
  }

  /* -------------------- Delegate Manager Client Write -------------------- */

  async delegateStake(
    targetSP: Address,
    amount: Amount
  ): Promise<DelegateStakeResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().delegateStake(targetSP, amount)
    return info
  }

  async requestUndelegateStake(
    targetSP: Address,
    amount: Amount
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().requestUndelegateStake(
      targetSP,
      amount
    )
    return info
  }

  async cancelUndelegateStakeRequest(): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().cancelUndelegateStakeRequest()
    return info
  }

  async undelegateStake(): Promise<UndelegateStakeResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().undelegateStake()
    return info
  }

  async claimRewards(serviceProvider: Address) {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().claimRewards(serviceProvider)
    return info
  }

  async requestRemoveDelegator(
    serviceProvider: Address,
    delegator: Address
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().requestRemoveDelegator(
      serviceProvider,
      delegator
    )
    return info
  }

  async cancelRemoveDelegatorRequest(
    serviceProvider: Address,
    delegator: Address
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().cancelRemoveDelegatorRequest(
      serviceProvider,
      delegator
    )
    return info
  }

  async removeDelegator(
    serviceProvider: Address,
    delegator: Address
  ): Promise<RemoveDelegatorResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().removeDelegator(
      serviceProvider,
      delegator
    )
    return info
  }
}
