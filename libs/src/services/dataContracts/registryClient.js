const Utils = require('../../utils')
const Web3Manager = require('../web3Manager/index')
const ProviderSelection = require('../contracts/ProviderSelection')

class RegistryClient {
  constructor (web3Manager, contractABI, contractAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    const web3 = this.web3Manager.getWeb3()
    this.Registry = new web3.eth.Contract(contractABI, contractAddress)
  }

  async getContract (contractRegistryKey) {
    let providerSelector
    if (this.web3Manager instanceof Web3Manager && !this.web3Manager.web3Config.useExternalWeb3) {
      const providerEndpoints = this.web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints
      providerSelector = new ProviderSelection(providerEndpoints)
    }

    const contract = await this.getContractWithProviderSelection(providerSelector, contractRegistryKey)
    return contract
  }

  async getContractWithProviderSelection (providerSelector, contractRegistryKey) {
    try {
      Utils.checkStrLen(contractRegistryKey, 32)
      return await this.Registry.methods.getContract(
        Utils.utf8ToHex(contractRegistryKey)
      ).call()
    } catch (e) {
      if (!(this.web3Manager instanceof Web3Manager) || this.web3Manager.web3Config.useExternalWeb3) {
        console.error(`Failed to initialize contract ${JSON.stringify(this.contractABI)}`, e)
        return
      }
      providerSelector.addUnhealthy(this.web3Manager.getWeb3().currentProvider.host)

      if (providerSelector.getUnhealthySize() === providerSelector.getServicesSize()) {
        console.error(`No available, healthy providers to get contract ${JSON.stringify(this.contractABI)}`, e)
        return
      }

      await providerSelector.select(this)
      const web3 = this.web3Manager.getWeb3()
      this.Registry = new web3.eth.Contract(this.contractABI, this.contractAddress)
      const contract = await this.getContractWithProviderSelection(providerSelector, contractRegistryKey)
      return contract
    }
  }
}

module.exports = RegistryClient
