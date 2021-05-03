const Utils = require('../../utils')
const GovernedContractClient = require('../contracts/GovernedContractClient')

class ServiceTypeManagerClient extends GovernedContractClient {
  async setServiceVersion (serviceType, serviceVersion, privateKey = null) {
    const method = await this.getGovernedMethod(
      'setServiceVersion',
      Utils.utf8ToHex(serviceType),
      Utils.utf8ToHex(serviceVersion)
    )
    return this.web3Manager.sendTransaction(
      method,
      (await this.governanceClient.getAddress()),
      privateKey
    )
  }

  async addServiceType (serviceType, serviceTypeMin, serviceTypeMax, privateKey = null) {
    const method = await this.getGovernedMethod(
      'addServiceType',
      Utils.utf8ToHex(serviceType),
      serviceTypeMin,
      serviceTypeMax
    )

    return this.web3Manager.sendTransaction(
      method,
      (await this.governanceClient.getAddress()),
      privateKey
    )
  }

  async getValidServiceTypes () {
    const method = await this.getMethod('getValidServiceTypes')
    const types = await method.call()
    return types.map(t => Utils.hexToUtf8(t))
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
    return parseInt(await method.call())
  }

  /**
   * @notice Add a new service type
   * @param serviceType
   * @returns {
   *  isValid: boolean - Is the types type is isValid
   *  minStake: number - minimum stake for service type
   *  maxStake: number - minimum stake for service type
   * }
   */
  async getServiceTypeInfo (serviceType) {
    const method = await this.getMethod('getServiceTypeInfo', Utils.utf8ToHex(serviceType))
    const response = await method.call()
    return {
      isValid: response[0],
      minStake: Utils.toBN(response[1]),
      maxStake: Utils.toBN(response[2])
    }
  }
}

module.exports = ServiceTypeManagerClient
