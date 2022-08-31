import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export class UserLibraryFactoryClient extends ContractClient {
  override web3Manager!: Web3Manager
  /* ------- SETTERS ------- */

  async addTrackSave(userId: number, trackId: number) {
    console.log('add track save')
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getTrackSaveRequestData(
      chainId,
      contractAddress,
      userId,
      trackId,
      nonce
    )
    console.log({ signatureData })
    const sig = await this.web3Manager.signTypedData(signatureData)
    console.log({ sig })
    const contractMethod = await this.getMethod(
      'addTrackSave',
      userId,
      trackId,
      nonce,
      sig
    )
    console.log({ contractAddress, contractMethod })
    return await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deleteTrackSave(userId: number, trackId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeleteTrackSaveRequestData(
        chainId,
        contractAddress,
        userId,
        trackId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod(
      'deleteTrackSave',
      userId,
      trackId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async addPlaylistSave(userId: number, playlistId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getPlaylistSaveRequestData(
        chainId,
        contractAddress,
        userId,
        playlistId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod(
      'addPlaylistSave',
      userId,
      playlistId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deletePlaylistSave(userId: number, playlistId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeletePlaylistSaveRequestData(
        chainId,
        contractAddress,
        userId,
        playlistId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod(
      'deletePlaylistSave',
      userId,
      playlistId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }
}
