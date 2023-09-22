import type { ContractABI, Logger } from '../../utils'
import type { GovernanceClient } from '../ethContracts/GovernanceClient'
import type { EthWeb3Manager } from '../ethWeb3Manager'
import type { Web3Manager } from '../web3Manager'

import type { GetRegistryAddress } from './ContractClient'
import { ContractClient } from './ContractClient'

/**
 * Contract class that extends a ContractClient and provides an interface
 * to retrieve governed methods that cannot be executed directly.
 */
export class GovernedContractClient extends ContractClient {
  governanceClient: GovernanceClient

  constructor(
    web3Manager: Web3Manager | EthWeb3Manager,
    contractABI: ContractABI['abi'],
    contractRegistryKey: string,
    getRegistryAddress: GetRegistryAddress,
    governanceClient: GovernanceClient,
    logger: Logger = console
  ) {
    super(
      web3Manager,
      contractABI,
      contractRegistryKey,
      getRegistryAddress,
      logger
    )
    this.governanceClient = governanceClient
  }

  /**
   * Gets a governed version of a method and allows a single transaction
   * to be sent to the governance client with the appropriate payload.
   * Similar to `getMethod`
   */
  async getGovernedMethod(methodName: string, ...args: unknown[]) {
    const contractMethod = await this.getMethod(methodName, ...args)
    const { signature, callData } =
      this.governanceClient.getSignatureAndCallData(methodName, contractMethod)
    const contractRegistryKey = this.web3Manager
      .getWeb3()
      .utils.utf8ToHex(this.contractRegistryKey)
    const method = await this.governanceClient.guardianExecuteTransaction(
      contractRegistryKey,
      signature,
      callData
    )
    return method
  }
}
