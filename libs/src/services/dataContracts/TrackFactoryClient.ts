import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export class TrackFactoryClient extends ContractClient {
  override web3Manager!: Web3Manager
  /* -------  GETTERS ------- */

  async getTrack(trackId: string) {
    const method = await this.getMethod('getTrack', trackId)
    return method.call()
  }

  /* -------  SETTERS ------- */

  /** uint _userId, bytes32 _multihashDigest, uint8 _multihashHashFn, uint8 _multihashSize */
  async addTrack(
    userId: number,
    multihashDigest: string,
    multihashHashFn: number,
    multihashSize: number
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getAddTrackRequestData(
      chainId,
      contractAddress,
      userId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'addTrack',
      userId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      trackId: parseInt(tx.events?.['NewTrack']?.returnValues._id, 10),
      txReceipt: tx
    }
  }

  /** uint _trackId, uint _trackOwnerId, bytes32 _multihashDigest, uint8 _multihashHashFn, uint8 _multihashSize */
  async updateTrack(
    trackId: number,
    trackOwnerId: number,
    multihashDigest: string,
    multihashHashFn: number,
    multihashSize: number
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getUpdateTrackRequestData(
      chainId,
      contractAddress,
      trackId,
      trackOwnerId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'updateTrack',
      trackId,
      trackOwnerId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )

    return {
      trackId: parseInt(tx.events?.['UpdateTrack']?.returnValues._trackId, 10),
      txReceipt: tx
    }
  }

  /**
   * @return deleted trackId from on-chain event log
   */
  async deleteTrack(trackId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getDeleteTrackRequestData(
      chainId,
      contractAddress,
      trackId,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod('deleteTrack', trackId, nonce, sig)

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      trackId: parseInt(tx.events?.['TrackDeleted']?.returnValues._trackId, 10),
      txReceipt: tx
    }
  }
}
