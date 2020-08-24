const web3 = require('web3')
const ethers = require('ethers')
const ContractClient = require('./ContractClient')

const abi = new ethers.utils.AbiCoder()

/**
 * ABI encodes argument types and values together into one encoded string
 * @param {Array<string>} types
 * @param {Array<string>} values
 */
const abiEncode = (types, values) => {
  return abi.encode(types, values)
}

/**
 * Transform a method name and its argument types into a string-composed
 * signature, e.g. someMethod(bytes32,int32)
 * @param {string} methodName
 * @param {Array<string>} argumentTypes
 */
const createMethodSignature = (methodName, argumentTypes) => {
  return `${methodName}(${argumentTypes.join(',')})`
}

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

    const argumentTypes = contractMethod._method.inputs.map(i => i.type)
    const argumentValues = contractMethod.arguments

    const signature = createMethodSignature(methodName, argumentTypes)
    const callData = abiEncode(argumentTypes, argumentValues)

    const contractRegistryKey = web3.utils.utf8ToHex(this.contractRegistryKey)

    const method = await this.governanceClient.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return method
  }
}

module.exports = GovernedContractClient
