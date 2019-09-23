const { Base, Services } = require('./base')
const Utils = require('../utils')

const MAX_PLAYLIST_LENGTH = 200

class Playlists extends Base {
  /* ------- GETTERS ------- */

  /**
   * get full playlist objects, including tracks, for passed in array of playlistId
   * @param {Array} playlistId list of playlist ids
   * @param {number} targetUserId the user whose playlists we're trying to get
   * @returns {Array} array of playlist objects
   * additional metadata fields on playlist objects:
   *  {Integer} repost_count - repost count for given playlist
   *  {Integer} save_count - save count for given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Array} followee_reposts - followees of current user that have reposted given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Boolean} has_current_user_saved - has current user saved given playlist
   */
  async getPlaylists (limit = 100, offset = 0, idsArray = null, targetUserId = null) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getPlaylists(limit, offset, idsArray, targetUserId)
  }

  /**
   * Return saved playlists for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedPlaylists (limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedPlaylists(limit, offset)
  }

  /**
   * Return saved albums for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedAlbums (limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedAlbums(limit, offset)
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
    let maxInitialTracks = 20
    let createInitialIdsArray = trackIds.slice(0, maxInitialTracks)
    let postInitialIdsArray = trackIds.slice(maxInitialTracks)
    let playlistId
    try {
      playlistId = await this.contracts.PlaylistFactoryClient.createPlaylist(userId, playlistName, isPrivate, isAlbum, createInitialIdsArray)

      // Add remaining tracks
      await Promise.all(postInitialIdsArray.map(trackId => {
        return this.contracts.PlaylistFactoryClient.addPlaylistTrack(playlistId, trackId)
      }))

      // Order tracks
      await this.contracts.PlaylistFactoryClient.orderPlaylistTracks(playlistId, trackIds)
    } catch (e) {
      return { playlistId, error: true }
    }
    return { playlistId, error: false }
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
   */
  async orderPlaylistTracks (playlistId, trackIds) {
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

    return this.contracts.PlaylistFactoryClient.orderPlaylistTracks(playlistId, trackIds)
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
  async addPlaylistRepost (userId, playlistId) {
    return this.contracts.SocialFeatureFactoryClient.addPlaylistRepost(userId, playlistId)
  }

  /**
   * Undoes a repost on a playlist for a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async deletePlaylistRepost (userId, playlistId) {
    return this.contracts.SocialFeatureFactoryClient.deletePlaylistRepost(userId, playlistId)
  }

  /**
   * Marks a track to be deleted from a playlist. The playlist entry matching
   * the provided timestamp is deleted in the case of duplicates.
   * @param {number} playlistId
   * @param {number} deletedTrackId
   * @param {string} deletedPlaylistTimestamp parseable timestamp (to be copied from playlist metadata)
   */
  async deletePlaylistTrack (playlistId, deletedTrackId, deletedPlaylistTimestamp) {
    return this.contracts.PlaylistFactoryClient.deletePlaylistTrack(playlistId, deletedTrackId, deletedPlaylistTimestamp)
  }

  /**
   * Saves a playlist on behalf of a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async addPlaylistSave (userId, playlistId) {
    return this.contracts.UserLibraryFactoryClient.addPlaylistSave(userId, playlistId)
  }

  /**
   * Unsaves a playlist on behalf of a user
   * @param {number} userId
   * @param {number} playlistId
   */
  async deletePlaylistSave (userId, playlistId) {
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
