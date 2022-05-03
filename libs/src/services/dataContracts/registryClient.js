const { Utils } = require('../../utils')
const Web3Manager = require('../web3Manager/index')
const { ProviderSelection } = require('../contracts/ProviderSelection')

class RegistryClient {
  constructor (web3Manager, contractABI, contractAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    const web3 = this.web3Manager.getWeb3()
    this.Registry = new web3.eth.Contract(contractABI, contractAddress)

    if (this.web3Manager instanceof Web3Manager && !this.web3Manager.web3Config.useExternalWeb3) {
      const providerEndpoints = this.web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints
      this.providerSelector = new ProviderSelection(providerEndpoints)
    } else {
      this.providerSelector = null
    }
  }

  async getContract (contractRegistryKey) {
    try {
      Utils.checkStrLen(contractRegistryKey, 32)
      const contract = await this.Registry.methods.getContract(
        Utils.utf8ToHex(contractRegistryKey)
      ).call()
      return contract
    } catch (e) {
      // If using ethWeb3Manager or useExternalWeb3 is true, do not do reselect provider logic and fail
      if (!this.providerSelector) {
        console.error(`Failed to initialize contract ${JSON.stringify(this.contractABI)}`, e)
        return
      }

      return this.retryInit(contractRegistryKey)
    }
  }

  async retryInit (contractRegistryKey) {
    try {
      await this.selectNewEndpoint()
      const web3 = this.web3Manager.getWeb3()
      this.Registry = new web3.eth.Contract(this.contractABI, this.contractAddress)
      return await this.getContract(contractRegistryKey)
    } catch (e) {
      console.error(e.message)
    }
  }

  async selectNewEndpoint () {
    this.providerSelector.addUnhealthy(this.web3Manager.getWeb3().currentProvider.host)

    if (this.providerSelector.getUnhealthySize() === this.providerSelector.getServicesSize()) {
      throw new Error(`No available, healthy providers to get contract ${JSON.stringify(this.contractABI)}`)
    }

    await this.providerSelector.select(this)
  }
}

module.exports = RegistryClient
