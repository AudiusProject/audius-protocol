const { Base, Services } = require('./base')
const Utils = require('../utils')
const retry = require('async-retry')

class Tracks extends Base {
  /* ------- GETTERS ------- */

  /**
   * get tracks with all relevant track data
   * can be filtered by providing an integer array of ids
   * @param {number} limit
   * @param {number} offset
   * @param {Object} idsArray
   * @param {number} targetUserId the owner of the tracks being queried
   * @param {number} currentUserId the currently logged in user
   * @param {string} sort a string of form eg. blocknumber:asc,timestamp:desc describing a sort path
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
  async getTracks (limit = 100, offset = 0, idsArray = null, targetUserId = null, sort = null, minBlockNumber = null) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getTracks(limit, offset, idsArray, targetUserId, sort, minBlockNumber)
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedTracks (limit = 100, offset = 0) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getSavedTracks(limit, offset)
  }

  /**
   * Gets tracks trending on Audius.
   * @param {string} timeFrame one of day, week, month, or year
   * @param {?Array<number>} idsArray track ids
   * @param {?number} limit
   * @param {?number} offset
   * @returns {{listenCounts: Array<{trackId:number, listens:number}>}}
   */
  async getTrendingTracks (time = null, idsArray = null, limit = null, offset = null) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.getTrendingTracks(time, idsArray, limit, offset)
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

    if (coverArtFile) this.FILE_IS_VALID(coverArtFile)

    this.IS_OBJECT(metadata)

    const owner = this.userStateManager.getCurrentUser()
    if (!owner.user_id) {
      throw new Error('No users loaded for this wallet')
    }

    metadata.owner_id = owner.user_id
    this._validateTrackMetadata(metadata)

    // Upload metadata
    const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadTrackContent(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
    // Write metadata to chain
    const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const { txReceipt, trackId } = await this.contracts.TrackFactoryClient.addTrack(
      owner.user_id,
      multihashDecoded.digest,
      multihashDecoded.hashFn,
      multihashDecoded.size
    )

    // Associate the track id with the file metadata and block number
    await this.creatorNode.associateTrack(trackId, metadataFileUUID, txReceipt.blockNumber)
    return trackId
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

    const owner = this.userStateManager.getCurrentUser()
    if (!owner.user_id) {
      throw new Error('No users loaded for this wallet')
    }

    metadata.owner_id = owner.user_id
    this._validateTrackMetadata(metadata)

    // Upload metadata
    const { metadataMultihash, metadataFileUUID } = await retry(async (bail, num) => {
      return this.creatorNode.uploadTrackContent(
        trackFile,
        coverArtFile,
        metadata,
        onProgress)
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
    return { metadataMultihash, metadataFileUUID }
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds tracks to chain for this user
   * Associates tracks with user on creatorNode
   */
  async addTracksToChainAndCnode (trackMultihashAndUUIDList) {
    this.REQUIRES(Services.CREATOR_NODE)
    const owner = this.userStateManager.getCurrentUser()
    if (!owner.user_id) {
      throw new Error('No users loaded for this wallet')
    }

    let addedToChain = []
    let requestFailed = false
    await Promise.all(
      trackMultihashAndUUIDList.map(async (trackInfo, i) => {
        try {
          const metadataMultihash = trackInfo.metadataMultihash
          const metadataFileUUID = trackInfo.metadataFileUUID
          // Write metadata to chain
          const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
          let { txReceipt, trackId } = await this.contracts.TrackFactoryClient.addTrack(
            owner.user_id,
            multihashDecoded.digest,
            multihashDecoded.hashFn,
            multihashDecoded.size
          )

          addedToChain[i] = { trackId, metadataFileUUID, txReceipt }
        } catch (e) {
          console.error(e)
          requestFailed = true
        }
      })
    )

    // Any failures in addTrack to the blockchain will prevent further progress
    // The list of successful track uploads is returned for revert operations by caller
    if (requestFailed) {
      return { error: true, trackIds: addedToChain.map(x => x.trackId) }
    }

    if (addedToChain.length !== trackMultihashAndUUIDList.length) {
      return { error: true, trackIds: addedToChain.map(x => x.trackId) }
    }

    let associatedWithCreatorNode = []
    try {
      await Promise.all(
        addedToChain.map(async chainTrackInfo => {
          const metadataFileUUID = chainTrackInfo.metadataFileUUID
          const trackId = chainTrackInfo.trackId
          await this.creatorNode.associateTrack(
            trackId,
            metadataFileUUID,
            chainTrackInfo.txReceipt.blockNumber)
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
   * @param {number} trackId id of the track from chain
   * @param {number} trackOwnerId id of the owner of the track from chain
   * @param {Object} metadata json of the track metadata with all fields, missing fields will error
   */
  async updateTrack (metadata, newOwnerId = null) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.IS_OBJECT(metadata)

    const ownerId = newOwnerId || this.userStateManager.getCurrentUserId()
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
   * @param {number} trackId
   * @param {number} userId
   */
  async logTrackListen (trackId, userId) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return this.identityService.logTrackListen(trackId, userId)
  }

  /**
   * Adds a repost for a given user and track
   * @param {number} user who reposted the track
   * @param {number} track being reposted
   */
  async addTrackRepost (userId, trackId) {
    return this.contracts.SocialFeatureFactoryClient.addTrackRepost(userId, trackId)
  }

  /**
   * Deletes a repost for a given user and track
   * @param {number} user who created the now deleted repost
   * @param {number} track id of deleted repost
   */
  async deleteTrackRepost (userId, trackId) {
    return this.contracts.SocialFeatureFactoryClient.deleteTrackRepost(userId, trackId)
  }

  /**
   * Adds a track save for a given user and track
   * @param {number} user saving track
   * @param {number} track being saved
   */
  async addTrackSave (userId, trackId) {
    return this.contracts.UserLibraryFactoryClient.addTrackSave(userId, trackId)
  }

  /**
   * Delete a track save for a given user and track
   * @param {number} user deleting track save
   * @param {number} track save being removed
   */
  async deleteTrackSave (userId, trackId) {
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
    const props = [
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
    const requiredProps = [
      'owner_id',
      'title'
    ]
    this.OBJECT_HAS_PROPS(metadata, props, requiredProps)
  }
}

module.exports = Tracks
