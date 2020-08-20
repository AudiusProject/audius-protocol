const Utils = require('../../utils')
const GovernedContractClient = require('../contracts/GovernedContractClient')
const DEFAULT_GAS_AMOUNT = 200000

class ServiceTypeManagerClient extends GovernedContractClient {
  async setServiceVersion (serviceType, serviceVersion, privateKey = null) {
    const registryKey = this.contractRegistryKey
    const method = await this.getGovernedMethod(
      'setServiceVersion',
      Utils.utf8ToHex(serviceType),
      Utils.utf8ToHex(serviceVersion)
    )
    const contractAddress = await this.getAddress()
    return this.web3Manager.sendTransaction(
      method,
      DEFAULT_GAS_AMOUNT,
      contractAddress,
      privateKey
    )
  }

  async getCurrentVersion (serviceType) {
    const method = await this.getMethod('getCurrentVersion', Utils.utf8ToHex(serviceType))
    let hexVersion = await method.call()
    return Utils.hexToUtf8(hexVersion)
  }

  async getVersion (serviceType, serviceTypeIndex) {
    let serviceTypeBytes32 = Utils.utf8ToHex(serviceType)
    const method = await this.getMethod('getVersion', serviceTypeBytes32, serviceTypeIndex)
    let version = await method.call()
    return Utils.hexToUtf8(version)
  }

  async getNumberOfVersions (serviceType) {
    const method = await this.getMethod('getNumberOfVersions', Utils.utf8ToHex(serviceType))
    return method.call()
  }
}

module.exports = ServiceTypeManagerClient
