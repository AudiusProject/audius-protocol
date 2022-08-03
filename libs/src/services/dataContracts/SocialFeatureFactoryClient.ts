import { ContractClient } from '../contracts/ContractClient'
import * as signatureSchemas from '../../data-contracts/signatureSchemas'
import type { Web3Manager } from '../web3Manager'

export class SocialFeatureFactoryClient extends ContractClient {
  override web3Manager!: Web3Manager

  async addTrackRepost(userId: number, trackId: number) {
    // generate new track repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getAddTrackRepostRequestData(
        chainId,
        contractAddress,
        userId,
        trackId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new trackRepost to chain
    const method = await this.getMethod(
      'addTrackRepost',
      userId,
      trackId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deleteTrackRepost(userId: number, trackId: number) {
    // generate new delete track repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeleteTrackRepostRequestData(
        chainId,
        contractAddress,
        userId,
        trackId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete trackRepost from chain
    const method = await this.getMethod(
      'deleteTrackRepost',
      userId,
      trackId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async addPlaylistRepost(userId: number, playlistId: number) {
    // generate new playlist repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getAddPlaylistRepostRequestData(
        chainId,
        contractAddress,
        userId,
        playlistId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new playlistRepost to chain
    const method = await this.getMethod(
      'addPlaylistRepost',
      userId,
      playlistId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deletePlaylistRepost(userId: number, playlistId: number) {
    // generate new delete playlist repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeletePlaylistRepostRequestData(
        chainId,
        contractAddress,
        userId,
        playlistId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete playlistRepost from chain
    const method = await this.getMethod(
      'deletePlaylistRepost',
      userId,
      playlistId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async addUserFollow(followerUserId: number, followeeUserId: number) {
    if (followerUserId === followeeUserId) {
      throw new Error(
        `addUserFollow -  identical value provided for follower and followee ${followerUserId}`
      )
    }
    // generate new UserFollow request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getUserFollowRequestData(
      chainId,
      contractAddress,
      followerUserId,
      followeeUserId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new UserFollow to chain
    const method = await this.getMethod(
      'addUserFollow',
      followerUserId,
      followeeUserId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deleteUserFollow(followerUserId: number, followeeUserId: number) {
    if (followerUserId === followeeUserId) {
      throw new Error(
        `deleteUserFollow - Invalid identical value provided for follower and followee ${followerUserId}`
      )
    }
    // generate new deleteUserFollow request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData =
      signatureSchemas.generators.getDeleteUserFollowRequestData(
        chainId,
        contractAddress,
        followerUserId,
        followeeUserId,
        nonce
      )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete UserFollow from chain
    const method = await this.getMethod(
      'deleteUserFollow',
      followerUserId,
      followeeUserId,
      nonce,
      sig
    )
    return await this.web3Manager.sendTransaction(
      method,
      this.contractRegistryKey,
      contractAddress
    )
  }
}
