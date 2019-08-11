const Utils = require('../../utils')
const DEFAULT_GAS_AMOUNT = 200000

class VersioningFactoryClient {
  constructor (ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.ethWeb3Manager = ethWeb3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress
    this.web3 = this.ethWeb3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.VersioningFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  async setServiceVersion (serviceType, serviceVersion, privateKey = null) {
    let contractMethod = this.VersioningFactory.methods.setServiceVersion(
      Utils.utf8ToHex(serviceType),
      Utils.utf8ToHex(serviceVersion))

    return this.ethWeb3Manager.sendTransaction(
      contractMethod,
      DEFAULT_GAS_AMOUNT,
      this.contractAddress,
      privateKey)
  }

  async getCurrentVersion (serviceType) {
    let hexVersion = await this.VersioningFactory.methods.getCurrentVersion(Utils.utf8ToHex(serviceType)).call()
    return Utils.hexToUtf8(hexVersion)
  }

  async getVersion (serviceType, serviceTypeIndex) {
    let serviceTypeBytes32 = Utils.utf8ToHex(serviceType)
    let version = await this.VersioningFactory.methods.getVersion(serviceTypeBytes32, serviceTypeIndex).call()
    return Utils.hexToUtf8(version)
  }

  async getNumberOfVersions (serviceType) {
    return this.VersioningFactory.methods.getNumberOfVersions(Utils.utf8ToHex(serviceType)).call()
  }
}

module.exports = VersioningFactoryClient
