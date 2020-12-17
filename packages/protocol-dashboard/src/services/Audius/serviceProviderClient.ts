import { AudiusClient } from './AudiusClient'
import BN from 'bn.js'

import {
  ServiceType,
  Address,
  Amount,
  BlockNumber,
  ServiceProvider,
  TxReceipt,
  TokenApproveReceipt,
  Node,
  Permission,
  Wallet
} from 'types'

export type NodeList = Array<Node>
export type GetServiceProviderIdsFromAddressResponse = Array<number>
export type GetPendingDecreaseStakeRequestResponse = {
  lockupExpiryBlock: BlockNumber
  amount: BN
}
export type GetServiceEndpointInfoFromAddressResponse = NodeList
export type GetServiceProviderListResponse = NodeList
export type DeregisterResponse = {
  txReceipt: TxReceipt
  spID: number
  serviceType: ServiceType
  owner: Address
  endpoint: string
}
export type RegisterResponse = {
  txReceipt: TxReceipt
  spID: number
  serviceType: ServiceType
  owner: Address
  endpoint: string
  tokenApproveReceipt: any
}
export type RegisterWithDelegateResponse = RegisterResponse
export type IncreaseStakeResponse = {
  txReceipt: TxReceipt
  tokenApproveReceipt: TokenApproveReceipt
}
export type DecreaseStakeResponse = { txReceipt: TxReceipt }

export default class ServiceProviderClient {
  aud: AudiusClient

  constructor(aud: AudiusClient) {
    this.aud = aud
  }

  getContract() {
    return this.aud.libs.ethContracts.ServiceProviderFactoryClient
  }

  /* -------------------- Service Provider Read -------------------- */

  async getTotalServiceTypeProviders(
    serviceType: ServiceType
  ): Promise<number> {
    await this.aud.hasPermissions()
    const numberServiceProviders = await this.getContract().getTotalServiceTypeProviders(
      serviceType
    )
    return numberServiceProviders
  }

  async getServiceProviderIdFromEndpoint(endpoint: string): Promise<number> {
    await this.aud.hasPermissions()
    const spId = await this.getContract().getServiceProviderIdFromEndpoint(
      endpoint
    )
    return spId
  }

  async getServiceEndpointInfo(
    serviceType: ServiceType,
    spID: number
  ): Promise<Node> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getServiceEndpointInfo(
      serviceType,
      spID
    )
    return info
  }

  async getServiceProviderInfoFromEndpoint(endpoint: string): Promise<Node> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getServiceProviderInfoFromEndpoint(
      endpoint
    )
    return info
  }

  async getServiceProviderIdsFromAddress(
    ownerAddress: Address,
    serviceType: ServiceType
  ): Promise<GetServiceProviderIdsFromAddressResponse> {
    await this.aud.hasPermissions()
    const ids = await this.getContract().getServiceProviderIdsFromAddress(
      ownerAddress,
      serviceType
    )
    return ids
  }

  async getPendingDecreaseStakeRequest(
    account: Address
  ): Promise<GetPendingDecreaseStakeRequestResponse> {
    await this.aud.hasPermissions()
    const pendingDecreaseStake = await this.getContract().getPendingDecreaseStakeRequest(
      account
    )
    return pendingDecreaseStake
  }

  async cancelDecreaseStakeRequest(account: Address): Promise<void> {
    await this.aud.hasPermissions()
    await this.getContract().cancelDecreaseStakeRequest(account)
  }

  async getLockupExpiry(account: Address): Promise<BlockNumber> {
    await this.aud.hasPermissions()
    const lockupExpiryBlock = await this.getContract().getLockupExpiry(account)
    return lockupExpiryBlock
  }

  async getServiceProviderIdFromAddress(
    ownerAddress: Address,
    serviceType: ServiceType
  ): Promise<number | null> {
    await this.aud.hasPermissions()
    const id = await this.getContract().getServiceProviderIdFromAddress(
      ownerAddress,
      serviceType
    )
    return id
  }

  async getServiceEndpointInfoFromAddress(
    ownerAddress: Address,
    serviceType: ServiceType
  ): Promise<GetServiceEndpointInfoFromAddressResponse> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getServiceEndpointInfoFromAddress(
      ownerAddress,
      serviceType
    )
    return info
  }

  async getServiceProviderList(
    serviceType: ServiceType
  ): Promise<GetServiceProviderListResponse> {
    await this.aud.hasPermissions()
    const serviceProviderList = await this.getContract().getServiceProviderList(
      serviceType
    )
    return serviceProviderList
  }

  async getServiceProviderDetails(account: Address): Promise<ServiceProvider> {
    await this.aud.hasPermissions()
    const serviceProvider = await this.getContract().getServiceProviderDetails(
      account
    )
    return serviceProvider
  }

  async getPendingUpdateDeployerCutRequest(
    ownerAddress: Address
  ): Promise<{ newDeployerCut: number; lockupExpiryBlock: number }> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getPendingUpdateDeployerCutRequest(
      ownerAddress
    )
    return info
  }

  async getDeregisteredService(
    serviceType: ServiceType,
    spID: number
  ): Promise<{
    delegateOwnerWallet: Address
    endpoint: string
    owner: Wallet
  }> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDeregisteredService({
      serviceType,
      spID
    })
    return info
  }

  async getDecreaseStakeLockupDuration(): Promise<number> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDecreaseStakeLockupDuration()
    return info
  }

  async getDeployerCutLockupDuration(): Promise<number> {
    await this.aud.hasPermissions()
    const info = await this.getContract().getDeployerCutLockupDuration()
    return info
  }

  async getRegisteredServiceProviderEvents(wallet: Address): Promise<any> {
    await this.aud.hasPermissions()
    const events = await this.getContract().getRegisteredServiceProviderEvents({
      owner: wallet
    })
    return events.map((event: any) => ({
      ...event,
      registrationAction: 'register'
    }))
  }

  async getDeregisteredServiceProviderEvents(wallet: Address): Promise<any> {
    await this.aud.hasPermissions()
    const events = await this.getContract().getDeregisteredServiceProviderEvents(
      {
        owner: wallet
      }
    )
    return events.map((event: any) => ({
      ...event,
      registrationAction: 'deregister'
    }))
  }

  async getIncreasedStakeEvents(wallet: Address): Promise<any> {
    await this.aud.hasPermissions()
    const events = await this.getContract().getIncreasedStakeEvents({
      owner: wallet
    })
    return events.map((event: any) => ({
      ...event,
      stakeAction: 'increase'
    }))
  }

  async getDecreasedStakeEvaluatedEvents(wallet: Address): Promise<any> {
    await this.aud.hasPermissions()
    const events = await this.getContract().getDecreasedStakeEvaluatedEvents({
      owner: wallet
    })
    return events.map((event: any) => ({
      ...event,
      stakeAction: 'decreaseEvaluated'
    }))
  }

  async getDecreasedStakeRequestedEvents(wallet: Address): Promise<any> {
    await this.aud.hasPermissions()
    const events = await this.getContract().getDecreasedStakeRequestedEvents({
      owner: wallet
    })
    return events.map((event: any) => ({
      ...event,
      stakeAction: 'decreaseRequested'
    }))
  }

  /* -------------------- Service Provider Write -------------------- */

  async registerWithDelegate(
    serviceType: ServiceType,
    endpoint: string,
    amount: Amount,
    delegateOwnerWallet: Address
  ): Promise<RegisterWithDelegateResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const registeredService = await this.getContract().registerWithDelegate(
      serviceType,
      endpoint,
      amount,
      delegateOwnerWallet
    )
    return registeredService
  }

  async register(
    serviceType: ServiceType,
    endpoint: string,
    amount: Amount
  ): Promise<RegisterResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const registeredService = await this.getContract().register(
      serviceType,
      endpoint,
      amount
    )
    return registeredService
  }

  async increaseStake(amount: Amount): Promise<IncreaseStakeResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const increaseTransaction = await this.getContract().increaseStake(amount)
    return increaseTransaction
  }

  async requestDecreaseStake(amount: Amount): Promise<BlockNumber> {
    await this.aud.hasPermissions(Permission.WRITE)
    const lockupExpiryBlock = await this.getContract().requestDecreaseStake(
      amount
    )
    return lockupExpiryBlock
  }

  async decreaseStake(): Promise<DecreaseStakeResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const decreasedStake = await this.getContract().decreaseStake()
    return decreasedStake
  }

  async deregister(
    serviceType: ServiceType,
    endpoint: string
  ): Promise<DeregisterResponse> {
    await this.aud.hasPermissions(Permission.WRITE)
    const decreasedStake = await this.getContract().deregister(
      serviceType,
      endpoint
    )
    return decreasedStake
  }

  async updateDelegateOwnerWallet(
    serviceType: ServiceType,
    endpoint: string,
    updatedDelegateOwnerWallet: Address
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().updateDelegateOwnerWallet(
      serviceType,
      endpoint,
      updatedDelegateOwnerWallet
    )
    return info
  }

  async updateEndpoint(
    serviceType: ServiceType,
    oldEndpoint: string,
    newEndpoint: string
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().updateEndpoint(
      serviceType,
      oldEndpoint,
      newEndpoint
    )
    return info
  }

  async requestUpdateDeployerCut(
    ownerAddress: Address,
    deployerCut: number
  ): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().requestUpdateDeployerCut(
      ownerAddress,
      deployerCut
    )
    return info
  }

  async cancelUpdateDeployerCut(ownerAddress: Address): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().cancelUpdateDeployerCut(ownerAddress)
    return info
  }

  async updateDeployerCut(ownerAddress: Address): Promise<TxReceipt> {
    await this.aud.hasPermissions(Permission.WRITE)
    const info = await this.getContract().updateDeployerCut(ownerAddress)
    return info
  }
}
