import { ContractABI, Utils } from '../../utils'
import { Web3Manager } from '../web3Manager'
import { ProviderSelection } from '../contracts/ProviderSelection'
import type { HttpProvider } from 'web3-core'
import type { Contract } from 'web3-eth-contract'

export class RegistryClient {
  web3Manager: Web3Manager
  contractABI: ContractABI['abi']
  contractAddress: string
  Registry: Contract
  providerSelector: ProviderSelection | null

  constructor(
    web3Manager: Web3Manager,
    contractABI: ContractABI['abi'],
    contractAddress: string
  ) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    const web3 = this.web3Manager.getWeb3()
    this.Registry = new web3.eth.Contract(contractABI, contractAddress)

    if (
      this.web3Manager instanceof Web3Manager &&
      !this.web3Manager.web3Config.useExternalWeb3
    ) {
      const providerEndpoints =
        this.web3Manager.web3Config.internalWeb3Config.web3ProviderEndpoints
      this.providerSelector = new ProviderSelection(providerEndpoints)
    } else {
      this.providerSelector = null
    }
  }

  async getContract(contractRegistryKey: string): Promise<string | undefined> {
    try {
      Utils.checkStrLen(contractRegistryKey, 32)
      const contract = await this.Registry.methods
        .getContract(Utils.utf8ToHex(contractRegistryKey))
        .call()
      return contract
    } catch (e) {
      // If using ethWeb3Manager or useExternalWeb3 is true, do not do reselect provider logic and fail
      if (!this.providerSelector) {
        console.error(
          `Failed to initialize contract ${JSON.stringify(this.contractABI)}`,
          e
        )
        return
      }

      return await this.retryInit(contractRegistryKey)
    }
  }

  async retryInit(contractRegistryKey: string) {
    try {
      await this.selectNewEndpoint()
      const web3 = this.web3Manager.getWeb3()
      this.Registry = new web3.eth.Contract(
        this.contractABI,
        this.contractAddress
      )
      return await this.getContract(contractRegistryKey)
    } catch (e) {
      console.error((e as Error).message)
      return undefined
    }
  }

  async selectNewEndpoint() {
    const currentHost = (
      this.web3Manager.getWeb3().currentProvider as HttpProvider
    ).host
    if (this.providerSelector) {
      this.providerSelector.addUnhealthy(currentHost)

      if (
        this.providerSelector.getUnhealthySize() ===
        this.providerSelector.getServicesSize()
      ) {
        throw new Error(
          `No available, healthy providers to get contract ${JSON.stringify(
            this.contractABI
          )}`
        )
      }

      await this.providerSelector.select(this)
    }
  }
}
