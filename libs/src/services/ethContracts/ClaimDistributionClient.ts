import type BN from 'bn.js'
import { ContractClient } from '../contracts/ContractClient'
import type { EthWeb3Manager } from '../ethWeb3Manager'

export class ClaimDistributionClient extends ContractClient {
  // ===================== Contract Methods =====================
  /**
   * Calls the contract method to check if the claim index has been claimed
   */
  async isClaimed(index: number) {
    const method = await this.getMethod('isClaimed', index)
    const isClaimed = await method.call()
    return isClaimed
  }

  /**
   * Proxies the calls the contract method to make a claim
   * @param index
   * @param account
   * @param amount
   * @param merkleProof
   * @returns transaction
   */
  async claim(
    index: number,
    account: string,
    amount: BN,
    merkleProof: string[]
  ) {
    const method = await this.getMethod(
      'claim',
      index,
      account,
      amount,
      merkleProof
    )
    const contractAddress = await this.getAddress()
    const tx = await (this.web3Manager as EthWeb3Manager).relayTransaction(
      method,
      contractAddress,
      account
    )
    return tx
  }
}
