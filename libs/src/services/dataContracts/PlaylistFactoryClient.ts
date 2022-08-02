import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

const MAX_PLAYLIST_LENGTH = 199

export class PlaylistFactoryClient extends ContractClient {
  override web3Manager!: Web3Manager
  /* ------- SETTERS ------- */

  async createPlaylist(
    userId: number,
    playlistName: string,
    isPrivate: boolean,
    isAlbum: boolean,
    trackIds: number[]
  ) {
    if (!Array.isArray(trackIds) || trackIds.length > MAX_PLAYLIST_LENGTH) {
      throw new Error(
        `Cannot create playlist - trackIds must be array with length <= ${MAX_PLAYLIST_LENGTH}`
      )
    }

    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const trackIdsHash = this.web3Manager
      .getWeb3()
      .utils.soliditySha3(
        this.web3Manager.getWeb3().eth.abi.encodeParameter('uint[]', trackIds)
      )
    const signatureData =
      signatureSchemas.generators.getCreatePlaylistRequestData(
        chainId,
        contractAddress,
        userId,
        playlistName,
        isPrivate,
        isAlbum,
        trackIdsHash,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'createPlaylist',
      userId,
      playlistName,
      isPrivate,
      isAlbum,
      trackIds,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      playlistId: parseInt(
        tx.events?.['PlaylistCreated']?.returnValues._playlistId,
        10
      ),
      txReceipt: tx
    }
  }

  async deletePlaylist(playlistId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeletePlaylistRequestData(
        chainId,
        contractAddress,
        playlistId,
        nonce
      )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'deletePlaylist',
      playlistId,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
    return {
      playlistId: parseInt(
        tx.events?.['PlaylistDeleted']?.returnValues._playlistId,
        10
      ),
      txReceipt: tx
    }
  }

  async addPlaylistTrack(playlistId: number, addedTrackId: number) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getAddPlaylistTrackRequestData(
        chainId,
        contractAddress,
        playlistId,
        addedTrackId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'addPlaylistTrack',
      playlistId,
      addedTrackId,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deletePlaylistTrack(
    playlistId: number,
    deletedTrackId: number,
    deletedPlaylistTimestamp: number,
    retries?: number
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeletePlaylistTrackRequestData(
        chainId,
        contractAddress,
        playlistId,
        deletedTrackId,
        deletedPlaylistTimestamp,
        nonce
      )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'deletePlaylistTrack',
      playlistId,
      deletedTrackId,
      deletedPlaylistTimestamp,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress,
      retries
    )
  }

  async orderPlaylistTracks(
    playlistId: number,
    trackIds: number[],
    retries?: number
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const trackIdsHash = this.web3Manager
      .getWeb3()
      .utils.soliditySha3(
        this.web3Manager.getWeb3().eth.abi.encodeParameter('uint[]', trackIds)
      )
    const signatureData =
      signatureSchemas.generators.getOrderPlaylistTracksRequestData(
        chainId,
        contractAddress,
        playlistId,
        trackIdsHash,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'orderPlaylistTracks',
      playlistId,
      trackIds,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method, // contractMethod
      this.contractRegistryKey,
      contractAddress,
      retries
    )
  }

  async updatePlaylistPrivacy(
    playlistId: number,
    updatedPlaylistPrivacy: boolean
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getUpdatePlaylistPrivacyRequestData(
        chainId,
        contractAddress,
        playlistId,
        updatedPlaylistPrivacy,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'updatePlaylistPrivacy',
      playlistId,
      updatedPlaylistPrivacy,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async updatePlaylistName(playlistId: number, updatedPlaylistName: string) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getUpdatePlaylistNameRequestData(
        chainId,
        contractAddress,
        playlistId,
        updatedPlaylistName,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'updatePlaylistName',
      playlistId,
      updatedPlaylistName,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async updatePlaylistCoverPhoto(
    playlistId: number,
    updatedPlaylistImageMultihashDigest: string
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getUpdatePlaylistCoverPhotoRequestData(
        chainId,
        contractAddress,
        playlistId,
        updatedPlaylistImageMultihashDigest,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const method = await this.getMethod(
      'updatePlaylistCoverPhoto',
      playlistId,
      updatedPlaylistImageMultihashDigest,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async updatePlaylistDescription(
    playlistId: number,
    updatedPlaylistDescription: string
  ) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getUpdatePlaylistDescriptionRequestData(
        chainId,
        contractAddress,
        playlistId,
        updatedPlaylistDescription,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'updatePlaylistDescription',
      playlistId,
      updatedPlaylistDescription,
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async updatePlaylistUPC(playlistId: number, updatedPlaylistUPC: string) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getUpdatePlaylistUPCRequestData(
        chainId,
        contractAddress,
        playlistId,
        this.web3Manager.getWeb3().utils.utf8ToHex(updatedPlaylistUPC),
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const method = await this.getMethod(
      'updatePlaylistUPC',
      playlistId,
      this.web3Manager.getWeb3().utils.utf8ToHex(updatedPlaylistUPC),
      nonce,
      sig
    )

    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async isTrackInPlaylist(playlistId: number, trackId: number) {
    const method = await this.getMethod(
      'isTrackInPlaylist',
      playlistId,
      trackId
    )
    const result = await method.call()
    return result
  }
}
