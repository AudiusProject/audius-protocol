import type BN from 'bn.js'

import type { ContractABI, Logger } from '../../utils'
import { ContractClient, GetRegistryAddress } from '../contracts/ContractClient'
import type { EthWeb3Manager } from '../ethWeb3Manager'

import type { AudiusTokenClient } from './AudiusTokenClient'

export class StakingProxyClient extends ContractClient {
  audiusTokenClient: AudiusTokenClient
  toBN: (value: string | number) => BN

  constructor(
    ethWeb3Manager: EthWeb3Manager,
    contractABI: ContractABI['abi'],
    contractRegistryKey: string,
    getRegistryAddress: GetRegistryAddress,
    audiusTokenClient: AudiusTokenClient,
    logger: Logger = console
  ) {
    super(
      ethWeb3Manager,
      contractABI,
      contractRegistryKey,
      getRegistryAddress,
      logger
    )
    this.audiusTokenClient = audiusTokenClient
    this.toBN = ethWeb3Manager.getWeb3().utils.toBN
  }

  async token() {
    const method = await this.getMethod('token')
    return method.call()
  }

  async totalStaked() {
    const method = await this.getMethod('totalStaked')
    return this.toBN(await method.call())
  }

  async supportsHistory() {
    const method = await this.getMethod('supportsHistory')
    return method.call()
  }

  async totalStakedFor(account: string) {
    const method = await this.getMethod('totalStakedFor', account)
    return this.toBN(await method.call())
  }

  async totalStakedForAt(account: string, blockNumber: string) {
    const method = await this.getMethod(
      'totalStakedForAt',
      account,
      blockNumber
    )
    return this.toBN(await method.call())
  }

  async totalStakedAt(blockNumber: number) {
    const method = await this.getMethod('totalStakedAt', blockNumber)
    return this.toBN(await method.call())
  }

  async isStaker(account: string) {
    const method = await this.getMethod('isStaker', account)
    return method.call()
  }

  async getDelegateManagerAddress() {
    const method = await this.getMethod('getDelegateManagerAddress')
    return method.call()
  }

  async getClaimsManagerAddress() {
    const method = await this.getMethod('getClaimsManagerAddress')
    return method.call()
  }

  async getServiceProviderFactoryAddress() {
    const method = await this.getMethod('getServiceProviderFactoryAddress')
    return method.call()
  }

  async getGovernanceAddress() {
    const method = await this.getMethod('getGovernanceAddress')
    return method.call()
  }

  async getLastClaimedBlockForUser() {
    const method = await this.getMethod(
      'lastClaimedFor',
      this.web3Manager.getWalletAddress()
    )
    const tx = await method.call()
    return tx
  }
}
