const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserLibraryFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.UserLibraryFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- SETTERS ------- */

  async addTrackSave (userId, trackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getTrackSaveRequestData(
      chainId,
      this.contractAddress,
      userId,
      trackId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.UserLibraryFactory.methods.addTrackSave(
      userId,
      trackId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async deleteTrackSave (userId, trackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeleteTrackSaveRequestData(
      chainId,
      this.contractAddress,
      userId,
      trackId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.UserLibraryFactory.methods.deleteTrackSave(
      userId,
      trackId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async addPlaylistSave (userId, playlistId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getPlaylistSaveRequestData(
      chainId,
      this.contractAddress,
      userId,
      playlistId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.UserLibraryFactory.methods.addPlaylistSave(
      userId,
      playlistId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async deletePlaylistSave (userId, playlistId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeletePlaylistSaveRequestData(
      chainId,
      this.contractAddress,
      userId,
      playlistId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.UserLibraryFactory.methods.deletePlaylistSave(
      userId,
      playlistId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }
}

module.exports = UserLibraryFactoryClient
