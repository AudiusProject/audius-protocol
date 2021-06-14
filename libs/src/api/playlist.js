const { Base, Services } = require('./base')
const Utils = require('../utils')

const MAX_PLAYLIST_LENGTH = 200

class Playlists extends Base {
  constructor (...args) {
    super(...args)
    this.getPlaylists = this.getPlaylists.bind(this)
    this.getSavedPlaylists = this.getSavedPlaylists.bind(this)
    this.getSavedAlbums = this.getSavedAlbums.bind(this)
    this.createPlaylist = this.createPlaylist.bind(this)
    this.addPlaylistTrack = this.addPlaylistTrack.bind(this)
    this.orderPlaylistTracks = this.orderPlaylistTracks.bind(this)
    this.validateTracksInPlaylist = this.validateTracksInPlaylist.bind(this)
    this.updatePlaylistCoverPhoto = this.updatePlaylistCoverPhoto.bind(this)
    this.updatePlaylistName = this.updatePlaylistName.bind(this)
    this.updatePlaylistDescription = this.updatePlaylistDescription.bind(this)
    this.updatePlaylistPrivacy = this.updatePlaylistPrivacy.bind(this)
    this.addPlaylistRepost = this.addPlaylistRepost.bind(this)
    this.deletePlaylistRepost = this.deletePlaylistRepost.bind(this)
    this.deletePlaylistTrack = this.deletePlaylistTrack.bind(this)
    this.addPlaylistSave = this.addPlaylistSave.bind(this)
    this.deletePlaylistSave = this.deletePlaylistSave.bind(this)
    this.deletePlaylist = this.deletePlaylist.bind(this)
  }

  /* ------- GETTERS ------- */

  /**
   * get full playlist objects, including tracks, for passed in array of playlistId
   * @param {number} limit max # of items to return
   * @param {number} offset offset into list to return from (for pagination)
   * @param {Array} idsArray list of playlist ids
   * @param {number} targetUserId the user whose playlists we're trying to get
   * @param {boolean} withUsers whether to return users nested within the collection objects
   * @returns {Array} array of playlist objects
   * additional metadata fields on playlist objects:
   *  {Integer} repost_count - repost count for given playlist
   *  {Integer} save_count - save count for given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Array} followee_reposts - followees of current user that have reposted given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Boolean} has_current_user_saved - has current user saved given playlist
   */
  async getPlaylists (limit = 100, offset = 0, idsArray = null, targetUserId = null, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getPlaylists(limit, offset, idsArray, targetUserId, withUsers)
  }

  /**
   * Return saved playlists for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedPlaylists (limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedPlaylists(limit, offset, withUsers)
  }

  /**
   * Return saved albums for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedAlbums (limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedAlbums(limit, offset, withUsers)
  }

  /* ------- SETTERS ------- */

  /**
   * Creates a new playlist
   * @param {number} userId
   * @param {string} playlistName
   * @param {boolean} isPrivate
   * @param {boolean} isAlbum
   * @param {Array<number>} trackIds
   */
  async createPlaylist (userId, playlistName, isPrivate, isAlbum, trackIds) {
    let maxInitialTracks = 50
    let createInitialIdsArray = trackIds.slice(0, maxInitialTracks)
    let postInitialIdsArray = trackIds.slice(maxInitialTracks)
    let playlistId
    let receipt = {}
    try {
      const response = await this.contracts.PlaylistFactoryClient.createPlaylist(
        userId, playlistName, isPrivate, isAlbum, createInitialIdsArray
      )
      playlistId = response.playlistId
      receipt = response.txReceipt

      // Add remaining tracks
      await Promise.all(postInitialIdsArray.map(trackId => {
        return this.contracts.PlaylistFactoryClient.addPlaylistTrack(playlistId, trackId)
      }))

      // Order tracks
      if (postInitialIdsArray.length > 0) {
        receipt = await this.contracts.PlaylistFactoryClient.orderPlaylistTracks(playlistId, trackIds)
      }
    } catch (e) {
      console.debug(`Reached libs createPlaylist catch block with playlist id ${playlistId}`)
      console.error(e)
      return { playlistId, error: true }
    }
    return { blockHash: receipt.blockHash, blockNumber: receipt.blockNumber, playlistId, error: false }
  }

  /**
   * Adds a track to a given playlist
   * @param {number} playlistId
   * @param {number} trackId
   */
  async addPlaylistTrack (playlistId, trackId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)

    const userId = this.userStateManager.getCurrentUserId()
    let playlist = await this.discoveryProvider.getPlaylists(100, 0, [playlistId], userId)

    // error if playlist does not exist or hasn't been indexed by discovery provider
    if (!Array.isArray(playlist) || !playlist.length) {
      throw new Error('Cannot add track - Playlist does not exist or has not yet been indexed by discovery provider')
    }
    // error if playlist already at max length
    if (playlist[0].playlist_contents.track_ids.length >= MAX_PLAYLIST_LENGTH) {
      throw new Error(`Cannot add track - playlist is already at max length of ${MAX_PLAYLIST_LENGTH}`)
    }
    return this.contracts.PlaylistFactoryClient.addPlaylistTrack(playlistId, trackId)
  }

  /**
   * Reorders the tracks in a playlist
   * @param {number} playlistId
   * @param {Array<number>} trackIds
   * @param {number?} retriesOverride [Optional, defaults to web3Manager.sendTransaction retries default]
   */
  async orderPlaylistTracks (playlistId, trackIds, retriesOverride) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    if (!Array.isArray(trackIds)) {
      throw new Error('Cannot order playlist - trackIds must be array')
    }

    const userId = this.userStateManager.getCurrentUserId()
    let playlist = await this.discoveryProvider.getPlaylists(100, 0, [playlistId], userId)

    // error if playlist does not exist or hasn't been indexed by discovery provider
    if (!Array.isArray(playlist) || !playlist.length) {
      throw new Error('Cannot order playlist - Playlist does not exist or has not yet been indexed by discovery provider')
    }

    let playlistTrackIds = playlist[0].playlist_contents.track_ids.map(a => a.track)
    // error if trackIds arg array length does not match playlist length
    if (trackIds.length !== playlistTrackIds.length) {
      throw new Error(`Cannot order playlist - trackIds length must match playlist length`)
    }

    // ensure existing playlist tracks and trackIds have same content, regardless of order
    let trackIdsSorted = [...trackIds].sort()
    let playlistTrackIdsSorted = playlistTrackIds.sort()
    for (let i = 0; i < trackIdsSorted.length; i++) {
      if (trackIdsSorted[i] !== playlistTrackIdsSorted[i]) {
        throw new Error('Cannot order playlist - trackIds must have same content as playlist tracks')
      }
    }

    return this.contracts.PlaylistFactoryClient.orderPlaylistTracks(playlistId, trackIds, retriesOverride)
  }

  /**
   * Checks if a playlist has entered a corrupted state
   * Check that each of the tracks within a playlist retrieved from discprov are in the onchain playlist
   * Note: the onchain playlists stores the tracks as a mapping of track ID to track count and the
   * track order is an event that is indexed by discprov. The track order event does not validate that the
   * updated order of tracks has the correct track count, so a track order event w/ duplicate tracks can
   * lead the playlist entering a corrupted state.
   * @param {number} playlistId
   */
  async validateTracksInPlaylist (playlistId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER, Services.CREATOR_NODE)

    const userId = this.userStateManager.getCurrentUserId()
    const playlistsReponse = await this.discoveryProvider.getPlaylists(1, 0, [playlistId], userId)

    // error if playlist does not exist or hasn't been indexed by discovery provider
    if (!Array.isArray(playlistsReponse) || !playlistsReponse.length) {
      throw new Error('Cannot validate playlist - Playlist does not exist, is private and not owned by current user or has not yet been indexed by discovery provider')
    }

    const playlist = playlistsReponse[0]
    const playlistTrackIds = playlist.playlist_contents.track_ids.map(a => a.track)

    // Check if each track is in the playlist
    const invalidTrackIds = []
    for (let trackId of playlistTrackIds) {
      const trackInPlaylist = await this.contracts.PlaylistFactoryClient.isTrackInPlaylist(playlistId, trackId)
      if (!trackInPlaylist) invalidTrackIds.push(trackId)
    }

    return {
      isValid: invalidTrackIds.length === 0,
      invalidTrackIds
    }
  }

  /**
   * Updates the cover photo for a playlist
   * @param {number} playlistId
   * @param {File} fileData
   */
  async updatePlaylistCoverPhoto (playlistId, fileData) {
    this.REQUIRES(Services.CREATOR_NODE)

    let updatedPlaylistImage = await this.creatorNode.uploadImage(fileData, true)
    return this.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
      playlistId,
      Utils.formatOptionalMultihash(updatedPlaylistImage.dirCID))
  }

  /**
   * Updates a playlist name
   * @param {number} playlistId
   * @param {string} playlistName
   */
  async updatePlaylistName (playlistId, playlistName) {
    return this.contracts.PlaylistFactoryClient.updatePlaylistName(playlistId, playlistName)
  }

  /**
   * Updates a playlist description
   * @param {number} playlistId
   * @param {string} updatedPlaylistDescription
   */
  async updatePlaylistDescription (playlistId, updatedPlaylistDescription) {
    return this.contracts.PlaylistFactoryClient.updatePlaylistDescription(playlistId, updatedPlaylistDescription)
  }

  /**
   * Updates whether a playlist is public or private
   * @param {number} playlistId
   * @param {boolean} updatedPlaylistPrivacy
   */
  async updatePlaylistPrivacy (playlistId, updatedPlaylistPrivacy) {
    return this.contracts.PlaylistFactoryClient.updatePlaylistPrivacy(playlistId, updatedPlaylistPrivacy)
  }

  /**
   * Reposts a playlist for a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async addPlaylistRepost (playlistId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.addPlaylistRepost(userId, playlistId)
  }

  /**
   * Undoes a repost on a playlist for a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async deletePlaylistRepost (playlistId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.deletePlaylistRepost(userId, playlistId)
  }

  /**
   * Marks a track to be deleted from a playlist. The playlist entry matching
   * the provided timestamp is deleted in the case of duplicates.
   * @param {number} playlistId
   * @param {number} deletedTrackId
   * @param {string} deletedPlaylistTimestamp parseable timestamp (to be copied from playlist metadata)
   * @param {number?} retriesOverride [Optional, defaults to web3Manager.sendTransaction retries default]
   */
  async deletePlaylistTrack (playlistId, deletedTrackId, deletedPlaylistTimestamp, retriesOverride) {
    return this.contracts.PlaylistFactoryClient.deletePlaylistTrack(playlistId, deletedTrackId, deletedPlaylistTimestamp, retriesOverride)
  }

  /**
   * Saves a playlist on behalf of a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async addPlaylistSave (playlistId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.UserLibraryFactoryClient.addPlaylistSave(userId, playlistId)
  }

  /**
   * Unsaves a playlist on behalf of a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async deletePlaylistSave (playlistId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.UserLibraryFactoryClient.deletePlaylistSave(userId, playlistId)
  }

  /**
   * Marks a playlist as deleted
   * @param {number} playlistId
   */
  async deletePlaylist (playlistId) {
    return this.contracts.PlaylistFactoryClient.deletePlaylist(playlistId)
  }
}

module.exports = Playlists
