import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export class UserReplicaSetManagerClient extends ContractClient {
  override web3Manager!: Web3Manager
  /**
   * Update a user's replica set on the UserReplicaSetManager contract
   * Callable by user wallet, or any node within the user's replica set
   * @param userId
   * @param primary
   * @param secondaries
   */
  async updateReplicaSet(
    userId: number,
    primary: number,
    secondaries: number[]
  ) {
    const existingReplicaSetInfo = await this.getUserReplicaSet(userId)
    return await this._updateReplicaSet(
      userId,
      primary,
      secondaries,
      existingReplicaSetInfo.primaryId,
      existingReplicaSetInfo.secondaryIds
    )
  }

  /**
   * Add a new content node to the L2 layer of the protocol
   * Requires signatures from 3 existing nodes on the UserReplicaSetManager contract
   * @param cnodeId
   * @param cnodeOwnerWallets - [0] = incoming delegateOwnerWallet, [1] = incoming ownerWallet
   * @param proposerSpIds
   * @param proposerNonces
   * @param proposer1Sig
   * @param proposer2Sig
   * @param proposer3Sig
   */
  async addOrUpdateContentNode(
    cnodeId: number,
    cnodeOwnerWallets: string[],
    proposerSpIds: number[],
    proposerNonces: string[],
    proposer1Sig: string,
    proposer2Sig: string,
    proposer3Sig: string
  ) {
    const contractAddress = await this.getAddress()
    const method = await this.getMethod(
      'addOrUpdateContentNode',
      cnodeId,
      cnodeOwnerWallets,
      proposerSpIds,
      proposerNonces,
      proposer1Sig,
      proposer2Sig,
      proposer3Sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return tx
  }

  /**
   * Generate the relevant data required to propose a new content node
   * Each incoming node requires 3 distinct signatures in order to be added
   * This function will be used by content nodes
   */
  async getProposeAddOrUpdateContentNodeRequestData(
    cnodeId: number,
    cnodeDelegateWallet: string,
    cnodeOwnerWallet: string,
    proposerSpId: number
  ) {
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const signatureData =
      signatureSchemas.generators.getProposeAddOrUpdateContentNodeRequestData(
        chainId,
        contractAddress,
        cnodeId,
        cnodeDelegateWallet,
        cnodeOwnerWallet,
        proposerSpId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    return {
      nonce,
      signatureData,
      sig
    }
  }

  /**
   * Returns replica set for requested user at requested blocknumber
   * @param userId
   * @returns replica set info with schema { primaryId: int, secondaryIds: number[] }
   */
  async getUserReplicaSet(userId: number) {
    const method = await this.getMethod('getUserReplicaSet', userId)
    const currentWallet = this.web3Manager.getWalletAddress()
    const resp: { primaryId: string; secondaryIds: string[] } =
      await method.call({ from: currentWallet })
    return {
      primaryId: parseInt(resp.primaryId),
      secondaryIds: resp.secondaryIds.map((x) => parseInt(x))
    }
  }

  /**
   * Returns replica set for requested user at requested blocknumber
   * @notice will error if web3 cannot find data for requested blocknumber
   * @returns replica set info with schema { primaryId: int, secondaryIds: int[] }
   */
  async getUserReplicaSetAtBlockNumber(userId: number, blockNumber: number) {
    const method = await this.getMethod('getUserReplicaSet', userId)
    const currentWallet = this.web3Manager.getWalletAddress()
    const resp: { primaryId: string; secondaryIds: string[] } =
      await method.call({ from: currentWallet }, blockNumber)
    return {
      primaryId: parseInt(resp.primaryId),
      secondaryIds: resp.secondaryIds.map((x) => parseInt(x))
    }
  }

  /**
   * Return the current ownerWallet and delegateOwnerWallet for a given spID
   */
  async getContentNodeWallets(spId: number) {
    const method = await this.getMethod('getContentNodeWallets', spId)
    const currentWallet = this.web3Manager.getWalletAddress()
    return method.call({ from: currentWallet })
  }

  /**
   * Return boolean indicating status of URSM seed operation
   * Prior to seed, no replica sets can be written
   */
  async getSeedComplete() {
    const method = await this.getMethod('getSeedComplete')
    const currentWallet = this.web3Manager.getWalletAddress()
    return method.call({ from: currentWallet })
  }

  /**
   * Submit update transaction to UserReplicaSetManager to modify a user's replica set
   * Can be sent by user's wallet, or any content node in the replica set
   * @param userId
   * @param primary
   * @param secondaries
   * @param oldPrimary
   * @param oldSecondaries
   */
  async _updateReplicaSet(
    userId: number,
    primary: number,
    secondaries: number[],
    oldPrimary: number,
    oldSecondaries: number[]
  ) {
    const contractAddress = await this.getAddress()
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const web3 = this.web3Manager.getWeb3()
    const secondariesHash = web3.utils.soliditySha3(
      web3.eth.abi.encodeParameter('uint[]', secondaries)
    )
    const oldSecondariesHash = web3.utils.soliditySha3(
      web3.eth.abi.encodeParameter('uint[]', oldSecondaries)
    )
    const signatureData =
      signatureSchemas.generators.getUpdateReplicaSetRequestData(
        chainId,
        contractAddress,
        userId,
        primary,
        secondariesHash,
        oldPrimary,
        oldSecondariesHash,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'updateReplicaSet',
      userId,
      primary,
      secondaries,
      oldPrimary,
      oldSecondaries,
      nonce,
      sig
    )
    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return tx
  }
}
