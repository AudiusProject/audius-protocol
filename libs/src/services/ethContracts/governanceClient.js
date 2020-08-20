const ContractClient = require('../contracts/ContractClient')

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
}

module.exports = GovernanceClient
