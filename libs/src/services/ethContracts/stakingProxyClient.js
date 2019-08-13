const Utils = require('../../utils')

class StakingProxyClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress, audiusTokenClient) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress
    this.audiusTokenClient = audiusTokenClient
    this.web3 = this.ethWeb3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.StakingProxy = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  async getCurrentVersion (serviceType) {
    let hexVersion = await this.StakingProxy.methods.getCurrentVersion(Utils.utf8ToHex(serviceType)).call()
    return Utils.hexToUtf8(hexVersion)
  }

  async token () {
    return this.StakingProxy.methods.token().call()
  }

  async totalStaked () {
    return parseInt(await this.StakingProxy.methods.totalStaked().call(), 10)
  }

  async getMinStakeAmount () {
    return parseInt(await this.StakingProxy.methods.getMinStakeAmount().call(), 10)
  }

  async getMaxStakeAmount () {
    return parseInt(await this.StakingProxy.methods.getMaxStakeAmount().call(), 10)
  }

  async supportsHistory () {
    return this.StakingProxy.methods.supportsHistory().call()
  }

  async totalStakedFor (account) {
    return parseInt(await this.StakingProxy.methods.totalStakedFor(account).call(), 10)
  }

  async fundNewClaim (amount) {
    let tokenApproveTx = await this.audiusTokenClient.approve(this.contractAddress, amount)
    let contractMethod = this.StakingProxy.methods.fundNewClaim(amount)
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod, 1000000)
    return {
      txReceipt: tx,
      tokenApproveReceipt: tokenApproveTx
    }
  }

  async getClaimInfo () {
    let tx = await this.StakingProxy.methods.getClaimInfo().call()
    return {
      txReceipt: tx,
      claimableAmount: tx[0] / Math.pow(10, 18),
      currentClaimBlock: tx[1]
    }
  }

  async makeClaim () {
    let contractMethod = this.StakingProxy.methods.makeClaim()
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod, 1000000)
    return {
      txReceipt: tx
    }
  }

  async setMinStakeAmount (amountInWei) {
    let contractMethod = this.StakingProxy.methods.setMinStakeAmount(amountInWei)
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod, 1000000)
    return { txReceipt: tx }
  }

  async setMaxStakeAmount (amountInWei) {
    let contractMethod = this.StakingProxy.methods.setMaxStakeAmount(amountInWei)
    let tx = await this.ethWeb3Manager.sendTransaction(contractMethod, 1000000)
    return { txReceipt: tx }
  }
}

module.exports = StakingProxyClient
