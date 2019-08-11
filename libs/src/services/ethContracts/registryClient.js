const Utils = require('../../utils')

class RegistryClient {
  constructor (web3Manager, contractABI, contractAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.web3Manager.getWeb3()
    this.Registry = new this.web3.eth.Contract(contractABI, contractAddress)
  }

  async getContract (contractRegistryKey) {
    Utils.checkStrLen(contractRegistryKey, 32)
    return this.Registry.methods.getContract(
      Utils.utf8ToHex(contractRegistryKey)
    ).call()
  }
}

module.exports = RegistryClient
