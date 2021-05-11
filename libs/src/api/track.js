const { Base, Services } = require('./base')
const CreatorNode = require('../services/creatorNode')
const Utils = require('../utils')
const retry = require('async-retry')

const TRACK_PROPS = [
  'owner_id',
  'title',
  'length',
  'cover_art_sizes',
  'tags',
  'genre',
  'mood',
  'credits_splits',
  'release_date',
  'file_type'
]
const TRACK_REQUIRED_PROPS = [
  'owner_id',
  'title'
]

class Track extends Base {
  constructor (...args) {
    super(...args)
    this.getTracks = this.getTracks.bind(this)
    this.getTracksIncludingUnlisted = this.getTracksIncludingUnlisted.bind(this)
    this.getUnlistedTracks = this.getUnlistedTracks.bind(this)
    this.getRandomTracks = this.getRandomTracks.bind(this)
    this.getStemsForTrack = this.getStemsForTrack.bind(this)
    this.getRemixesOfTrack = this.getRemixesOfTrack.bind(this)
    this.getRemixTrackParents = this.getRemixTrackParents.bind(this)
    this.getSavedTracks = this.getSavedTracks.bind(this)
    this.getTrendingTracks = this.getTrendingTracks.bind(this)
    this.getTrackListens = this.getTrackListens.bind(this)
    this.getSaversForTrack = this.getSaversForTrack.bind(this)
    this.getSaversForPlaylist = this.getSaversForPlaylist.bind(this)
    this.getRepostersForTrack = this.getRepostersForTrack.bind(this)
    this.getRepostersForPlaylist = this.getRepostersForPlaylist.bind(this)
    this.getListenHistoryTracks = this.getListenHistoryTracks.bind(this)
    this.checkIfDownloadAvailable = this.checkIfDownloadAvailable.bind(this)
    this.uploadTrack = this.uploadTrack.bind(this)
    this.uploadTrackContentToCreatorNode = this.uploadTrackContentToCreatorNode.bind(this)
    this.addTracksToChainAndCnode = this.addTracksToChainAndCnode.bind(this)
    this.updateTrack = this.updateTrack.bind(this)
    this.logTrackListen = this.logTrackListen.bind(this)
    this.addTrackRepost = this.addTrackRepost.bind(this)
    this.deleteTrackRepost = this.deleteTrackRepost.bind(this)
    this.addTrackSave = this.addTrackSave.bind(this)
    this.deleteTrackSave = this.deleteTrackSave.bind(this)
    this.deleteTrack = this.deleteTrack.bind(this)
  }
  /* ------- GETTERS ------- */

  /**
   * get tracks with all relevant track data
   * can be filtered by providing an integer array of ids
   * @param {number} limit
   * @param {number} offset
   * @param {Object} idsArray
   * @param {number} targetUserId the owner of the tracks being queried
   * @param {string} sort a string of form eg. blocknumber:asc,timestamp:desc describing a sort path
   * @param {number} minBlockNumber The min block number
   * @param {boolean} filterDeleted If set to true filters out deleted tracks
   * @returns {Object} {Array of track metadata Objects}
   * additional metadata fields on track objects:
   *  {Integer} repost_count - repost count for given track
   *  {Integer} save_count - save count for given track
   *  {Array} followee_reposts - followees of current user that have reposted given track
   *  {Boolean} has_current_user_reposted - has current user reposted given track
   *  {Boolean} has_current_user_saved - has current user saved given track
   * @example
   * await getTracks()
   * await getTracks(100, 0, [3,2,6]) - Invalid track ids will not be accepted
   */
  async getTracks (limit = 100, offset = 0, idsArray = null, targetUserId = null, sort = null, minBlockNumber = null, filterDeleted = null, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getTracks(limit, offset, idsArray, targetUserId, sort, minBlockNumber, filterDeleted, withUsers)
  }

  /**
   * @typedef {Object} getTracksIdentifier
   * @property {string} handle
   * @property {number} id
   * @property {string} url_title
   */

  /**
   * gets all tracks matching identifiers, including unlisted.
   *
   * @param {getTracksIdentifier[]} identifiers
   * @returns {(Array)} track
   */
  async getTracksIncludingUnlisted (identifiers, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getTracksIncludingUnlisted(identifiers, withUsers)
  }

  /**
   * Gets all unlisted track for a user.
   * Will only return tracks for the currently authed user.
   *
   * @returns {(Array)} tracks array of tracks
   */
  async getUnlistedTracks () {
    this.REQUIRES(Services.CREATOR_NODE)
    return this.creatorNode.getUnlistedTracks()
  }

  /**
   * Gets random tracks from trending tracks for a given genre.
   * If genre not given, will return trending tracks across all genres.
   * Excludes specified track ids.
   *
   * @param {string} genre
   * @param {number} limit
   * @param {number[]} exclusionList
   * @param {string} time
   * @returns {(Array)} track
   */
  async getRandomTracks (genre, limit, exclusionList, time) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getRandomTracks(genre, limit, exclusionList, time)
  }

  /**
   * Gets all stems for a given trackId as an array of tracks.
   * @param {number} trackId
   * @returns {(Array)} track
   */
  async getStemsForTrack (trackId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getStemsForTrack(trackId)
  }

  /**
   * Gets all the remixes of a given trackId as an array of tracks.
   * @param {number} trackId
   * @param {number} limit
   * @param {number} offset
   * @returns {(Array)} track
   */
  async getRemixesOfTrack (trackId, limit = null, offset = null) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getRemixesOfTrack(trackId, limit, offset)
  }

  /**
   * Gets the remix parents of a given trackId as an array of tracks.
   * @param {number} trackId
   * @param {number} limit
   * @param {number} offset
   * @returns {(Array)} track
   * @returns {(Array)} track
   */
  async getRemixTrackParents (trackId, limit = null, offset = null) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getRemixTrackParents(trackId, limit, offset)
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedTracks (limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedTracks(limit, offset, withUsers)
  }

  /**
   * Gets tracks trending on Audius.
   * @param {string} genre
   * @param {string} timeFrame one of day, week, month, or year
   * @param {?Array<number>} idsArray track ids
   * @param {?number} limit
   * @param {?number} offset
   * @returns {{listenCounts: Array<{trackId:number, listens:number}>}}
   */
  async getTrendingTracks (genre = null, time = null, idsArray = null, limit = null, offset = null, withUsers = false) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.discoveryProvider.getTrendingTracks(genre, time, idsArray, limit, offset)
  }

  /**
   * Gets listens for tracks bucketted by timeFrame.
   * @param {string} timeFrame one of day, week, month, or year
   * @param {?Array<number>} idsArray track ids
   * @param {?string} startTime parseable by Date.parse
   * @param {?string} endTime parseable by Date.parse
   * @param {?number} limit
   * @param {?number} offset
   * @returns {{bucket:Array<{trackId:number, date:bucket, listens:number}>}}
    */
  async getTrackListens (timeFrame = null, idsArray = null, startTime = null, endTime = null, limit = null, offset = null) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.getTrackListens(timeFrame, idsArray, startTime, endTime, limit, offset)
  }

  /**
   * get users that saved saveTrackId, sorted by follower count descending
   * @param {number} saveTrackId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForTrack(100, 0, 1) - ID must be valid
   */
  async getSaversForTrack (limit = 100, offset = 0, saveTrackId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSaversForTrack(limit, offset, saveTrackId)
  }

  /**
   * get users that saved savePlaylistId, sorted by follower count descending
   * @param {number} savePlaylistId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForPlaylist(100, 0, 1) - ID must be valid
   */
  async getSaversForPlaylist (limit = 100, offset = 0, savePlaylistId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSaversForPlaylist(limit, offset, savePlaylistId)
  }

  /**
   * get users that reposted repostTrackId, sorted by follower count descending
   * @param {number} repostTrackId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForTrack(100, 0, 1) - ID must be valid
   */
  async getRepostersForTrack (limit = 100, offset = 0, repostTrackId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getRepostersForTrack(limit, offset, repostTrackId)
  }

  /**
   * get users that reposted repostPlaylistId, sorted by follower count descending
   * @param {number} repostPlaylistId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForPlaylist(100, 0, 1) - ID must be valid
   */
  async getRepostersForPlaylist (limit = 100, offset = 0, repostPlaylistId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getRepostersForPlaylist(limit, offset, repostPlaylistId)
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getListenHistoryTracks (limit = 100, offset = 0) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const userId = this.userStateManager.getCurrentUserId()
    return this.identityService.getListenHistoryTracks(userId, limit, offset)
  }

  /**
   * Checks if a download is available from provided creator node endpoints
   * @param {string} creatorNodeEndpoints creator node endpoints
   * @param {number} trackId
   */
  async checkIfDownloadAvailable (trackId, creatorNodeEndpoints) {
    return CreatorNode.checkIfDownloadAvailable(trackId, creatorNodeEndpoints)
  }

  /* ------- SETTERS ------- */

  /**
   * Takes in a readable stream if isServer is true, or a file reference if isServer is
   * false.
   * Uploads file, retrieves multihash, adds multihash to input metadata object,
   * uploads metadata, and finally returns metadata multihash
   * Wraps the stateless function in AudiusLib.
   *
   * @param {File} trackFile ReadableStream from server, or File handle on client
   * @param {File} coverArtFile ReadableStream from server, or File handle on client
   * @param {Object} metadata json of the track metadata with all fields, missing fields will error
   * @param {function} onProgress callback fired with (loaded, total) on byte upload progress
   */
  async uploadTrack (
    trackFile,
    coverArtFile,
    metadata,
    onProgress
  ) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.FILE_IS_VALID(trackFile)

    const phases = {
      GETTING_USER: 'GETTING_USER',
      UPLOADING_TRACK_CONTENT: 'UPLOADING_TRACK_CONTENT',
      ADDING_TRACK: 'ADDING_TRACK',
      ASSOCIATING_TRACK: 'ASSOCIATING_TRACK'
    }

    let phase = phases.GETTING_USER

    try {
      if (coverArtFile) this.FILE_IS_VALID(coverArtFile)

      this.IS_OBJECT(metadata)

      const ownerId = this.userStateManager.getCurrentUserId()
      if (!ownerId) {
        return {
          error: 'No users loaded for this wallet',
          phase
        }
      }

      metadata.owner_id = ownerId
      this._validateTrackMetadata(metadata)

      phase = phases.UPLOADING_TRACK_CONTENT

      // Upload metadata
      const {
        metadataMultihash,
        metadataFileUUID,
        transcodedTrackUUID
      } = await this.creatorNode.uploadTrackContent(
        trackFile,
        coverArtFile,
        metadata,
        onProgress
      )

      phase = phases.ADDING_TRACK

      // Write metadata to chain
      const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
      const { txReceipt, trackId } = await this.contracts.TrackFactoryClient.addTrack(
        ownerId,
        multihashDecoded.digest,
        multihashDecoded.hashFn,
        multihashDecoded.size
      )

      phase = phases.ASSOCIATING_TRACK
      // Associate the track id with the file metadata and block number
      await this.creatorNode.associateTrack(
        trackId,
        metadataFileUUID,
        txReceipt.blockNumber,
        transcodedTrackUUID
      )
      return { trackId, error: false }
    } catch (e) {
      return {
        error: e.message,
        phase
      }
    }
  }

  /**
   * Takes in a readable stream if isServer is true, or a file reference if isServer is
   * false.
   * WARNING: Uploads file to creator node, but does not call contracts
   * Please pair this with the addTracksToChainAndCnode
   */
  async uploadTrackContentToCreatorNode (
    trackFile,
    coverArtFile,
    metadata,
    onProgress
  ) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.FILE_IS_VALID(trackFile)

    if (coverArtFile) this.FILE_IS_VALID(coverArtFile)

    this.IS_OBJECT(metadata)

    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    metadata.owner_id = ownerId
    this._validateTrackMetadata(metadata)

    // Upload metadata
    const { metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID } = await retry(async (bail, num) => {
      return this.creatorNode.uploadTrackContent(
        trackFile,
        coverArtFile,
        metadata,
        onProgress
      )
    }, {
    // Retry function 3x
    // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
      minTimeout: 500,
      maxTimeout: 4000,
      factor: 3,
      retries: 3,
      onRetry: (err, i) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log('Retry error : ', err)
        }
      }
    })
    return { metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID }
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds tracks to chain for this user
   * Associates tracks with user on creatorNode
   */
  async addTracksToChainAndCnode (trackMultihashAndUUIDList) {
    this.REQUIRES(Services.CREATOR_NODE)
    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    let addedToChain = []
    let requestFailed = false
    await Promise.all(
      trackMultihashAndUUIDList.map(async (trackInfo, i) => {
        try {
          const { metadataMultihash, metadataFileUUID, transcodedTrackUUID } = trackInfo

          // Write metadata to chain
          const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
          let { txReceipt, trackId } = await this.contracts.TrackFactoryClient.addTrack(
            ownerId,
            multihashDecoded.digest,
            multihashDecoded.hashFn,
            multihashDecoded.size
          )

          addedToChain[i] = { trackId, metadataFileUUID, transcodedTrackUUID, txReceipt }
        } catch (e) {
          requestFailed = true
          console.error(e)
        }
      })
    )

    // Any failures in addTrack to the blockchain will prevent further progress
    // The list of successful track uploads is returned for revert operations by caller
    if (requestFailed || (addedToChain.filter(Boolean).length !== trackMultihashAndUUIDList.length)) {
      return { error: true, trackIds: addedToChain.filter(Boolean).map(x => x.trackId) }
    }

    let associatedWithCreatorNode = []
    try {
      await Promise.all(
        addedToChain.map(async chainTrackInfo => {
          const metadataFileUUID = chainTrackInfo.metadataFileUUID
          const transcodedTrackUUID = chainTrackInfo.transcodedTrackUUID
          const trackId = chainTrackInfo.trackId
          await this.creatorNode.associateTrack(
            trackId,
            metadataFileUUID,
            chainTrackInfo.txReceipt.blockNumber,
            transcodedTrackUUID
          )
          associatedWithCreatorNode.push(trackId)
        })
      )
    } catch (e) {
      // Any single failure to associate also prevents further progress
      // Returning error code along with associated track ids allows caller to revert
      return { error: true, trackIds: addedToChain.map(x => x.trackId) }
    }

    return { error: false, trackIds: addedToChain.map(x => x.trackId) }
  }

  /**
   * Updates an existing track given metadata. This function expects that all associated files
   * such as track content, cover art are already on creator node.
   * @param {Object} metadata json of the track metadata with all fields, missing fields will error
   */
  async updateTrack (metadata) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.IS_OBJECT(metadata)

    const ownerId = this.userStateManager.getCurrentUserId()

    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }
    metadata.owner_id = ownerId
    this._validateTrackMetadata(metadata)

    // Upload new metadata
    const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadTrackMetadata(
      metadata
    )
    // Write the new metadata to chain
    const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const trackId = metadata.track_id
    const { txReceipt } = await this.contracts.TrackFactoryClient.updateTrack(
      trackId,
      ownerId,
      multihashDecoded.digest,
      multihashDecoded.hashFn,
      multihashDecoded.size
    )
    // Re-associate the track id with the new metadata
    await this.creatorNode.associateTrack(trackId, metadataFileUUID, txReceipt.blockNumber)
    return trackId
  }

  /**
   * Logs a track listen for a given user id.
   * @param {string} unauthUuid account for those not logged in
   * @param {number} trackId listened to
   */
  async logTrackListen (trackId, unauthUuid, solanaListen = false) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const accountId = this.userStateManager.getCurrentUserId()

    const userId = accountId || unauthUuid
    return this.identityService.logTrackListen(
      trackId,
      userId,
      null,
      null,
      solanaListen
    )
  }

  /** Adds a repost for a given user and track
  * @param {number} trackId track being reposted
  */
  async addTrackRepost (trackId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.addTrackRepost(userId, trackId)
  }

  /**
   * Deletes a repost for a given user and track
   * @param {number} track id of deleted repost
   */
  async deleteTrackRepost (trackId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.deleteTrackRepost(userId, trackId)
  }

  /**
   * Adds a track save for a given user and track
   * @param {number} trackId track being saved
   */
  async addTrackSave (trackId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.UserLibraryFactoryClient.addTrackSave(userId, trackId)
  }

  /**
   * Delete a track save for a given user and track
   * @param {number} track save being removed
   */
  async deleteTrackSave (trackId) {
    const userId = this.userStateManager.getCurrentUserId()
    return this.contracts.UserLibraryFactoryClient.deleteTrackSave(userId, trackId)
  }

  /**
   * Marks a tracks as deleted
   * @param {number} trackId
   */
  async deleteTrack (trackId) {
    return this.contracts.TrackFactoryClient.deleteTrack(trackId)
  }

  /* ------- PRIVATE  ------- */

  _validateTrackMetadata (metadata) {
    this.OBJECT_HAS_PROPS(metadata, TRACK_PROPS, TRACK_REQUIRED_PROPS)
  }
}

module.exports = Track
