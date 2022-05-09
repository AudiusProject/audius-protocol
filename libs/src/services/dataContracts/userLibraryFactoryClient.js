const { ContractClient } = require('../contracts/ContractClient')
const signatureSchemas = require('../../../data-contracts/signatureSchemas')

class UserLibraryFactoryClient extends ContractClient {
  /* ------- SETTERS ------- */

  async addTrackSave (userId, trackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getTrackSaveRequestData(
      chainId,
      contractAddress,
      userId,
      trackId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod('addTrackSave',
      userId,
      trackId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deleteTrackSave (userId, trackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getDeleteTrackSaveRequestData(
      chainId,
      contractAddress,
      userId,
      trackId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod('deleteTrackSave',
      userId,
      trackId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async addPlaylistSave (userId, playlistId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getPlaylistSaveRequestData(
      chainId,
      contractAddress,
      userId,
      playlistId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod('addPlaylistSave',
      userId,
      playlistId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }

  async deletePlaylistSave (userId, playlistId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.getEthNetId()
    const contractAddress = await this.getAddress()
    const signatureData = signatureSchemas.generators.getDeletePlaylistSaveRequestData(
      chainId,
      contractAddress,
      userId,
      playlistId,
      nonce)
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = await this.getMethod('deletePlaylistSave',
      userId,
      playlistId,
      nonce,
      sig)
    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      contractAddress
    )
  }
}

module.exports = UserLibraryFactoryClient
