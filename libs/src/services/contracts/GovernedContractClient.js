const ContractClient = require('./ContractClient')

/**
 * Contract class that extends a ContractClient and provides an interface
 * to retrieve governed methods that cannot be executed directly.
 */
class GovernedContractClient extends ContractClient {
  constructor (
    web3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    governanceClient
  ) {
    super(web3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.governanceClient = governanceClient
  }

  /**
   * Gets a governed version of a method and allows a single transaction
   * to be sent to the governance client with the appropriate payload.
   * Similar to `getMethod`
   */
  async getGovernedMethod (methodName, ...args) {
    const contractMethod = await this.getMethod(methodName, ...args)
    const { signature, callData } = this.governanceClient.getSignatureAndCallData(methodName, contractMethod)
    const contractRegistryKey = this.web3Manager.getWeb3().utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.governanceClient.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return method
  }
}

module.exports = GovernedContractClient
