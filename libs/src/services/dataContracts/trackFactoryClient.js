const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class TrackFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.TrackFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* -------  GETTERS ------- */

  async getTrack (trackId) {
    return this.TrackFactory.methods.getTrack(trackId).call()
  }

  /* -------  SETTERS ------- */

  /** uint _userId, bytes32 _multihashDigest, uint8 _multihashHashFn, uint8 _multihashSize */
  async addTrack (userId, multihashDigest, multihashHashFn, multihashSize) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getAddTrackRequestData(
      chainId,
      this.contractAddress,
      userId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.TrackFactory.methods.addTrack(
      userId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return parseInt(tx.events.NewTrack.returnValues._id, 10)
  }

  /** uint _trackId, uint _trackOwnerId, bytes32 _multihashDigest, uint8 _multihashHashFn, uint8 _multihashSize */
  async updateTrack (trackId, trackOwnerId, multihashDigest, multihashHashFn, multihashSize) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdateTrackRequestData(
      chainId,
      this.contractAddress,
      trackId,
      trackOwnerId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.TrackFactory.methods.updateTrack(
      trackId,
      trackOwnerId,
      multihashDigest,
      multihashHashFn,
      multihashSize,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return parseInt(tx.events.UpdateTrack.returnValues._trackId, 10)
  }

  /**
   * @param {uint} trackId
   * @return {uint} deleted trackId from on-chain event log
   */
  async deleteTrack (trackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeleteTrackRequestData(
      chainId,
      this.contractAddress,
      trackId,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.TrackFactory.methods.deleteTrack(trackId, nonce, sig)

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return parseInt(tx.events.TrackDeleted.returnValues._trackId, 10)
  }
}

module.exports = TrackFactoryClient
