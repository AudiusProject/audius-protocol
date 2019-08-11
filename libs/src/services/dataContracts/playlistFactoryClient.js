const signatureSchemas = require('../../../data-contracts/signatureSchemas')

const MAX_PLAYLIST_LENGTH = 199

class PlaylistFactoryClient {
  constructor (web3Manager, contractABI, contractRegistryKey, getRegistryAddress) {
    this.web3Manager = web3Manager
    this.contractABI = contractABI
    this.contractRegistryKey = contractRegistryKey
    this.getRegistryAddress = getRegistryAddress

    this.web3 = this.web3Manager.getWeb3()
  }

  async init () {
    this.contractAddress = await this.getRegistryAddress(this.contractRegistryKey)
    this.PlaylistFactory = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
  }

  /* ------- SETTERS ------- */

  async createPlaylist (userId, playlistName, isPrivate, isAlbum, trackIds) {
    if (!Array.isArray(trackIds) || trackIds.length > MAX_PLAYLIST_LENGTH) {
      throw new Error(`Cannot create playlist - trackIds must be array with length <= ${MAX_PLAYLIST_LENGTH}`)
    }

    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const trackIdsHash = this.web3.utils.soliditySha3(
      this.web3.eth.abi.encodeParameter('uint[]', trackIds)
    )
    const signatureData = signatureSchemas.generators.getCreatePlaylistRequestData(
      chainId,
      this.contractAddress,
      userId,
      playlistName,
      isPrivate,
      isAlbum,
      trackIdsHash,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.createPlaylist(
      userId,
      playlistName,
      isPrivate,
      isAlbum,
      trackIds,
      nonce,
      sig
    )

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress,
      8000000
    )
    return parseInt(tx.events.PlaylistCreated.returnValues._playlistId, 10)
  }

  async deletePlaylist (playlistId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeletePlaylistRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.PlaylistFactory.methods.deletePlaylist(playlistId, nonce, sig)

    const tx = await this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
    return parseInt(tx.events.PlaylistDeleted.returnValues._playlistId, 10)
  }

  async addPlaylistTrack (playlistId, addedTrackId) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getAddPlaylistTrackRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      addedTrackId,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.addPlaylistTrack(
      playlistId,
      addedTrackId,
      nonce,
      sig)

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress,
      1000000 // TODO move to const
    )
  }

  async deletePlaylistTrack (playlistId, deletedTrackId, deletedPlaylistTimestamp) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getDeletePlaylistTrackRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      deletedTrackId,
      deletedPlaylistTimestamp,
      nonce
    )

    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.PlaylistFactory.methods.deletePlaylistTrack(
      playlistId,
      deletedTrackId,
      deletedPlaylistTimestamp,
      nonce,
      sig)

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async orderPlaylistTracks (playlistId, trackIds) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const trackIdsHash = this.web3.utils.soliditySha3(this.web3.eth.abi.encodeParameter('uint[]', trackIds))
    const signatureData = signatureSchemas.generators.getOrderPlaylistTracksRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      trackIdsHash,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.orderPlaylistTracks(
      playlistId,
      trackIds,
      nonce,
      sig)

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress,
      8000000
    )
  }

  async updatePlaylistPrivacy (playlistId, updatedPlaylistPrivacy) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdatePlaylistPrivacyRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      updatedPlaylistPrivacy,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.updatePlaylistPrivacy(
      playlistId,
      updatedPlaylistPrivacy,
      nonce,
      sig
    )

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async updatePlaylistName (playlistId, updatedPlaylistName) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdatePlaylistNameRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      updatedPlaylistName,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.updatePlaylistName(
      playlistId,
      updatedPlaylistName,
      nonce,
      sig
    )

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async updatePlaylistCoverPhoto (playlistId, updatedPlaylistImageMultihashDigest) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdatePlaylistCoverPhotoRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      updatedPlaylistImageMultihashDigest,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)

    const contractMethod = this.PlaylistFactory.methods.updatePlaylistCoverPhoto(
      playlistId,
      updatedPlaylistImageMultihashDigest,
      nonce,
      sig
    )

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async updatePlaylistDescription (playlistId, updatedPlaylistDescription) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdatePlaylistDescriptionRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      updatedPlaylistDescription,
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.PlaylistFactory.methods.updatePlaylistDescription(
      playlistId,
      updatedPlaylistDescription,
      nonce,
      sig
    )

    return this.web3Manager.sendTransaction(
      contractMethod,
      this.contractRegistryKey,
      this.contractAddress
    )
  }

  async updatePlaylistUPC (playlistId, updatedPlaylistUPC) {
    const nonce = signatureSchemas.getNonce()
    const chainId = await this.web3.eth.net.getId()
    const signatureData = signatureSchemas.generators.getUpdatePlaylistUPCRequestData(
      chainId,
      this.contractAddress,
      playlistId,
      this.web3.utils.utf8ToHex(updatedPlaylistUPC),
      nonce
    )
    const sig = await this.web3Manager.signTypedData(signatureData)
    const contractMethod = this.PlaylistFactory.methods.updatePlaylistUPC(
      playlistId,
      this.web3.utils.utf8ToHex(updatedPlaylistUPC),
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

module.exports = PlaylistFactoryClient
