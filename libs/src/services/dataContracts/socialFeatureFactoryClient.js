const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class SocialFeatureFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.SocialFeatureFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  async addTrackRepost (userId, trackId) {
    // generate new track repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getAddTrackRepostRequestData(
      chainId,
      this.contractAddress,
      userId,
      trackId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new trackRepost to chain
    const contractMethod = this.SocialFeatureFactory.methods.addTrackRepost(
      userId,
      trackId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async deleteTrackRepost (userId, trackId) {
    // generate new delete track repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeleteTrackRepostRequestData(
      chainId,
      this.contractAddress,
      userId,
      trackId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete trackRepost from chain
    const contractMethod = this.SocialFeatureFactory.methods.deleteTrackRepost(
      userId,
      trackId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async addPlaylistRepost (userId, playlistId) {
    // generate new playlist repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getAddPlaylistRepostRequestData(
      chainId,
      this.contractAddress,
      userId,
      playlistId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new playlistRepost to chain
    const contractMethod = this.SocialFeatureFactory.methods.addPlaylistRepost(
      userId,
      playlistId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async deletePlaylistRepost (userId, playlistId) {
    // generate new delete playlist repost request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeletePlaylistRepostRequestData(
      chainId,
      this.contractAddress,
      userId,
      playlistId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete playlistRepost from chain
    const contractMethod = this.SocialFeatureFactory.methods.deletePlaylistRepost(
      userId,
      playlistId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async addUserFollow (followerUserId, followeeUserId) {
    // generate new UserFollow request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUserFollowRequestData(
      chainId,
      this.contractAddress,
      followerUserId,
      followeeUserId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // add new UserFollow to chain
    const contractMethod = this.SocialFeatureFactory.methods.addUserFollow(
      followerUserId,
      followeeUserId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async deleteUserFollow (followerUserId, followeeUserId) {
    // generate new deleteUserFollow request
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeleteUserFollowRequestData(
      chainId,
      this.contractAddress,
      followerUserId,
      followeeUserId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    // delete UserFollow from chain
    const contractMethod = this.SocialFeatureFactory.methods.deleteUserFollow(
      followerUserId,
      followeeUserId,
      nonce,
      sig
    )
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }
}

module.exports = SocialFeatureFactoryClient
