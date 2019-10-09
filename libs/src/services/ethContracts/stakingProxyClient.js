const Utils = require('../../utils')
const ContractClient = require('../contracts/ContractClient')

class StakingProxyClient extends ContractClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, audiusTokenClient) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
  }

  async getCurrentVersion (serviceType) {
    const method = await this.getMethod('getCurrentVersion', Utils.utf8ToHex(serviceType))
    let hexVersion = await method.call()
    return Utils.hexToUtf8(hexVersion)
  }

  async token () {
    const method = await this.getMethod('token')
    return method.call()
  }

  async totalStaked () {
    const method = await this.getMethod('totalStaked')
    return parseInt(await method.call(), 10)
  }

  async getMinStakeAmount () {
    const method = await this.getMethod('getMinStakeAmount')
    return parseInt(await method.call(), 10)
  }

  async getMaxStakeAmount () {
    const method = await this.getMethod('getMaxStakeAmount')
    return parseInt(await method.call(), 10)
  }

  async supportsHistory () {
    const method = await this.getMethod('supportsHistory')
    return method.call()
  }

  async totalStakedFor (account) {
    const method = await this.getMethod('totalStakedFor', account)
    return parseInt(await method.call(), 10)
  }

  /**
   * Funds the treasury that service providers claim from
   */
  async fundNewClaim (amount, privateKey = null) {
    const contractAddress = await this.getAddress()
    const tokenApproveTx = await this.audiusTokenClient.approve(
      contractAddress,
      amount,
      privateKey)
    const method = await this.getMethod('fundNewClaim', amount)
    let tx
    if (privateKey === null) {
      tx = await this.web3Manager.sendTransaction(method, 1000000)
    } else {
      tx = await this.web3Manager.sendTransaction(
        method,
        1000000,
        contractAddress,
        privateKey)
    }
    return {
      txReceipt: tx,
      tokenApproveReceipt: tokenApproveTx
    }
  }

  async getLastClaimedBlockForUser () {
    const method = await this.getMethod('lastClaimedFor', this.web3Manager.getWalletAddress())
    let tx = await method.call()
    return tx
  }

  async getClaimInfo () {
    const method = await this.getMethod('getClaimInfo')
    let tx = await method.call()
    return {
      txReceipt: tx,
      claimableAmount: tx[0] / Math.pow(10, 18),
      currentClaimBlock: parseInt(tx[1], 10)
    }
  }

  async makeClaim () {
    const method = await this.getMethod('makeClaim')
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
    return {
      txReceipt: tx
    }
  }

  async setMinStakeAmount (amountInWei) {
    const method = await this.getMethod('setMinStakeAmount', amountInWei)
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
    return { txReceipt: tx }
  }

  async setMaxStakeAmount (amountInWei) {
    const method = await this.getMethod('setMaxStakeAmount', amountInWei)
    let tx = await this.web3Manager.sendTransaction(method, 1000000)
    return { txReceipt: tx }
  }
}

module.exports = StakingProxyClient
