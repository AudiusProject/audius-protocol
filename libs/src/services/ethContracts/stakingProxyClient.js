const ContractClient = require('../contracts/ContractClient')

class StakingProxyClient extends ContractClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, audiusTokenClient) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
    this.toBN = ethWeb3Manager.getWeb3().utils.toBN
  }

  async token () {
    const method = await this.getMethod('token')
    return method.call()
  }

  async totalStaked () {
    const method = await this.getMethod('totalStaked')
    return this.toBN(await method.call())
  }

  async supportsHistory () {
    const method = await this.getMethod('supportsHistory')
    return method.call()
  }

  async totalStakedFor (account) {
    const method = await this.getMethod('totalStakedFor', account)
    return this.toBN(await method.call())
  }

  async totalStakedForAt (account, blockNumber) {
    const method = await this.getMethod('totalStakedForAt', account, blockNumber)
    return this.toBN(await method.call())
  }

  async isStaker (account) {
    const method = await this.getMethod('isStaker', account)
    return method.call()
  }

  async getDelegateManagerAddress () {
    const method = await this.getMethod('getDelegateManagerAddress')
    return method.call()
  }
  async getClaimsManagerAddress () {
    const method = await this.getMethod('getClaimsManagerAddress')
    return method.call()
  }
  async getServiceProviderFactoryAddress () {
    const method = await this.getMethod('getServiceProviderFactoryAddress')
    return method.call()
  }
  async getGovernanceAddress () {
    const method = await this.getMethod('getGovernanceAddress')
    return method.call()
  }

  async getLastClaimedBlockForUser () {
    const method = await this.getMethod('lastClaimedFor', this.web3Manager.getWalletAddress())
    let tx = await method.call()
    return tx
  }
}

module.exports = StakingProxyClient
