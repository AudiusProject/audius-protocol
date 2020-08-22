const ethers = require('ethers')
const ContractClient = require('../contracts/ContractClient')

const DEFAULT_GAS_AMOUNT = 200000

/**
 * ABI encodes argument types and values together into one encoded string
 * @param {Array<string>} types
 * @param {Array<string>} values
 */
const abiEncode = (types, values) => {
  const abi = new ethers.utils.AbiCoder()
  return abi.encode(types, values)
}

/**
 * Transform a method name and its argument types into a string-composed
 * signature, e.g. someMethod(bytes32, int32)
 * @param {string} methodName
 * @param {Array<string>} argumentTypes
 */
const createMethodSignature = (methodName, argumentTypes) => {
  return `${methodName}(${argumentTypes.join(',')})`
}

class GovernanceClient extends ContractClient {
  constructor (
    ethWeb3Manager,
    contractABI,
    contractRegistryKey,
    getRegistryAddress,
    audiusTokenClient,
    stakingProxyClient,
    isDebug = false
  ) {
    super(ethWeb3Manager, contractABI, contractRegistryKey, getRegistryAddress)
    this.audiusTokenClient = audiusTokenClient
    this.stakingProxyClient = stakingProxyClient
    this.isDebug = isDebug
  }

  getSignatureAndCallData (methodName, contractMethod) {
    const argumentTypes = contractMethod._method.inputs.map(i => i.type)
    const argumentValues = contractMethod.arguments

    const signature = createMethodSignature(methodName, argumentTypes)
    const callData = abiEncode(argumentTypes, argumentValues)

    return { signature, callData }
  }

  async guardianExecuteTransaction (
    registryKey,
    functionSignature,
    callData
  ) {
    // 0 eth valued transaction. We don't anticipate needed to attach
    // value to this txn, so default to 0.
    const callValue0 = this.web3Manager.getWeb3().utils.toBN(0)

    const method = await this.getMethod(
      'guardianExecuteTransaction',
      registryKey,
      callValue0,
      functionSignature,
      callData
    )
    return method
  }

  async setVotingPeriod (
    period
  ) {
    const methodName = 'setVotingPeriod'
    const contractMethod = await this.getMethod(methodName, period)
    const { signature, callData } = this.getSignatureAndCallData(methodName, contractMethod)
    const registryKey = this.web3Manager.getWeb3().utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      registryKey,
      signature,
      callData
    )
    return this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }

  async setExecutionDelay (
    delay
  ) {
    const methodName = 'setExecutionDelay'
    const contractMethod = await this.getMethod(methodName, delay)
    const { signature, callData } = this.getSignatureAndCallData(methodName, contractMethod)
    const registryKey = this.web3Manager.getWeb3().utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.guardianExecuteTransaction(
      registryKey,
      signature,
      callData
    )
    return this.web3Manager.sendTransaction(method, DEFAULT_GAS_AMOUNT)
  }
}

module.exports = GovernanceClient
