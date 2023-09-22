import type Web3 from 'web3'
import type { Contract } from 'web3-eth-contract'
import type { AbiItem } from 'web3-utils'

import { Utils } from '../../utils'
import type { EthWeb3Manager } from '../ethWeb3Manager'

export class RegistryClient {
  web3Manager: EthWeb3Manager
  contractABI: AbiItem[]
  contractAddress: string
  web3: Web3
  Registry: Contract

  constructor(
    web3Manager: EthWeb3Manager,
    contractABI: AbiItem[],
    contractAddress: string
  ) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractAddress = contractAddress

    this.web3 = this.web3Manager.getWeb3()
    this.Registry = new this.web3.eth.Contract(contractABI, contractAddress)
  }

  async getContract(contractRegistryKey: string): Promise<string> {
    Utils.checkStrLen(contractRegistryKey, 32)
    return this.Registry.methods
      .getContract(Utils.utf8ToHex(contractRegistryKey))
      .call()
  }
}
