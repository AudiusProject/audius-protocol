const { pick } = require('lodash')
const { Base, Services } = require('./base')
const Utils = require('../utils')
const CreatorNode = require('../services/creatorNode')

const USER_PROPS = [
  'is_creator',
  'is_verified',
  'name',
  'handle',
  'profile_picture',
  'profile_picture_sizes',
  'cover_photo',
  'cover_photo_sizes',
  'bio',
  'location',
  'creator_node_endpoint'
]
const USER_REQUIRED_PROPS = [
  'name',
  'handle'
]

class Users extends Base {
  constructor (...args) {
    super(...args)
    this.getUsers = this.getUsers.bind(this)
    this.getMutualFollowers = this.getMutualFollowers.bind(this)
    this.getFollowersForUser = this.getFollowersForUser.bind(this)
    this.getFolloweesForUser = this.getFolloweesForUser.bind(this)
    this.getUserRepostFeed = this.getUserRepostFeed.bind(this)
    this.getSocialFeed = this.getSocialFeed.bind(this)
    this.getTopCreatorsByGenres = this.getTopCreatorsByGenres.bind(this)
    this.uploadProfileImages = this.uploadProfileImages.bind(this)
    this.addUser = this.addUser.bind(this)
    this.upgradeToCreator = this.upgradeToCreator.bind(this)
    this.updateUserMetadata = this.updateUserMetadata.bind(this)
    this.assignReplicaSet = this.assignReplicaSet.bind(this)
    this.updateIsVerified = this.updateIsVerified.bind(this)
    this.addUserFollow = this.addUserFollow.bind(this)
    this.deleteUserFollow = this.deleteUserFollow.bind(this)
    this.getClockValuesFromReplicaSet = this.getClockValuesFromReplicaSet.bind(this)
    this._waitForContentNodeEndpointUpdate = this._waitForContentNodeEndpointUpdate.bind(this)
    this.getClockValuesFromReplicaSet = this.getClockValuesFromReplicaSet.bind(this)
    this._addUserOperations = this._addUserOperations.bind(this)
    this._updateUserOperations = this._updateUserOperations.bind(this)
    this._validateUserMetadata = this._validateUserMetadata.bind(this)
    this._cleanUserMetadata = this._cleanUserMetadata.bind(this)
    this._handleMetadata = this._handleMetadata.bind(this)
  }

  /* ----------- GETTERS ---------- */

  /**
   * get users with all relevant user data
   * can be filtered by providing an integer array of ids
   * @param {number} limit
   * @param {number} offset
   * @param {Object} idsArray
   * @param {String} walletAddress
   * @param {String} handle
   * @param {Boolean} isCreator null returns all users, true returns creators only, false returns users only
   * @param {number} currentUserId the currently logged in user
   * @returns {Object} {Array of User metadata Objects}
   * additional metadata fields on user objects:
   *  {Integer} track_count - track count for given user
   *  {Integer} playlist_count - playlist count for given user
   *  {Integer} album_count - album count for given user
   *  {Integer} follower_count - follower count for given user
   *  {Integer} followee_count - followee count for given user
   *  {Integer} repost_count - repost count for given user
   *  {Integer} track_blocknumber - blocknumber of latest track for user
   *  {Boolean} does_current_user_follow - does current user follow given user
   *  {Array} followee_follows - followees of current user that follow given user
   * @example
   * await getUsers()
   * await getUsers(100, 0, [3,2,6]) - Invalid user ids will not be accepted
   */
  async getUsers (limit = 100, offset = 0, idsArray = null, walletAddress = null, handle = null, isCreator = null, minBlockNumber = null) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getUsers(limit, offset, idsArray, walletAddress, handle, isCreator, minBlockNumber)
  }

  /**
   * get intersection of users that follow followeeUserId and users that are followed by followerUserId
   * @param {number} followeeUserId user that is followed
   * @example
   * getMutualFollowers(100, 0, 1, 1) - IDs must be valid
   */
  async getMutualFollowers (limit = 100, offset = 0, followeeUserId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    const followerUserId = this.userStateManager.getCurrentUserId()
    if (followerUserId) {
      return this.discoveryProvider.getFollowIntersectionUsers(limit, offset, followeeUserId, followerUserId)
    }
    return []
  }

  /**
   * get users that follow followeeUserId, sorted by follower count descending
   * @param {number} currentUserId the currently logged in user
   * @param {number} followeeUserId user that is followed
   * @return {Array} array of user objects with standard user metadata
   */
  async getFollowersForUser (limit = 100, offset = 0, followeeUserId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getFollowersForUser(limit, offset, followeeUserId)
  }

  /**
   * get users that are followed by followerUserId, sorted by follower count descending
   * @param {number} currentUserId the currently logged in user
   * @param {number} followerUserId user - i am the one who follows
   * @return {Array} array of user objects with standard user metadata
   */
  async getFolloweesForUser (limit = 100, offset = 0, followerUserId) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getFolloweesForUser(limit, offset, followerUserId)
  }

  /**
   * Return repost feed for requested user
   * @param {number} userId - requested user id
   * @param {filter} string - filter by "all", "original", or "repost"
   * @param {number} limit - max # of items to return (for pagination)
   * @param {number} offset - offset into list to return from (for pagination)
   * @returns {Object} {Array of track and playlist metadata objects}
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getUserRepostFeed (userId, filter, limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getUserRepostFeed(userId, filter, limit, offset, withUsers)
  }

  /**
   * Return social feed for current user
   * @param {number} limit - max # of items to return
   * @param {filter} string - filter by "all", "original", or "repost"
   * @param {number} offset - offset into list to return from (for pagination)
   * @returns {Object} {Array of track and playlist metadata objects}
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getSocialFeed (filter, limit = 100, offset = 0, withUsers = false, tracksOnly = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    const owner = this.userStateManager.getCurrentUser()
    if (owner) {
      return this.discoveryProvider.getSocialFeed(filter, limit, offset, withUsers, tracksOnly)
    }

    return []
  }

  /**
   * Returns the top users for the specified genres
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   * @param {Object} {Array of genres} - filter by genres ie. "Rock", "Alternative"
   * @param {Boolean} with_users - If the userIds should be returned or the full user metadata
   * @returns {Object} {Array of user objects if with_users set, else array of userIds}
   */
  async getTopCreatorsByGenres (genres, limit = 30, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return this.discoveryProvider.getTopCreatorsByGenres(genres, limit, offset, withUsers)
  }

  /* ------- SETTERS ------- */

  /**
   * Create an on-chain non-creator user. Some fields are restricted (ex.
   * creator_node_endpoint); this should error if the metadata given attempts to set them.
   * @param {Object} metadata metadata to associate with the user
   */
  async addUser (metadata) {
    this.IS_OBJECT(metadata)
    const newMetadata = this._cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    let userId
    const currentUser = this.userStateManager.getCurrentUser()
    if (currentUser && currentUser.handle) {
      userId = currentUser.user_id
    } else {
      userId = (await this.contracts.UserFactoryClient.addUser(newMetadata.handle)).userId
    }
    await this._addUserOperations(userId, newMetadata)

    newMetadata.wallet = this.web3Manager.getWalletAddress()
    newMetadata.user_id = userId
    this.userStateManager.updateCurrentUser(newMetadata)
    return newMetadata
  }

  /**
   * Assigns a replica set to the user's metadata and adds new metadata to chain.
   * This creates a record for that user on the connected creator node.
   * @param {Object} serviceProvider instance of ServiceProvider. Used for Content Node selection
   * @param {number} userId
   * @param {string[]} newContentNodeEndpoints comma separated list of Content Node endpoints
   */
  /**
   * Assigns a replica set to the user's metadata and adds new metadata to chain.
   * This creates a record for that user on the connected creator node.
   * @param {Object} param
   * @param {Object} param.serviceProvider instance of ServiceProvider. Used for Content Node selection
   * @param {number} param.userId
   * @param {string[]} param.[newContentNodeEndpoints='']
   * @param {Set<string>} param.[passList=null] whether or not to include only specified nodes
   * @param {Set<string>} param.[blockList=null]  whether or not to exclude any nodes
   */
  /**
   */
  async assignReplicaSet ({
    serviceProvider,
    userId,
    newContentNodeEndpoints = '', // ??? what is this supposed to look like
    passList = null,
    blockList = null
  }) {
    this.REQUIRES(Services.CREATOR_NODE)
    const phases = {
      CLEAN_AND_VALIDATE_METADATA: 'CLEAN_AND_VALIDATE_METADATA',
      AUTOSELECT_CONTENT_NODES: 'AUTOSELECT_CONTENT_NODES',
      SYNC_ACROSS_CONTENT_NODES: 'SYNC_ACROSS_CONTENT_NODES',
      SET_PRIMARY: 'SET_PRIMARY',
      UPLOAD_METADATA_AND_UPDATE_ON_CHAIN: 'UPLOAD_METADATA_AND_UPDATE_ON_CHAIN'
    }
    let phase = ''
    const numNodes = 3

    const user = this.userStateManager.getCurrentUser()
    // Failed the addUser() step
    if (!user) { throw new Error('No current user') }
    // No-op if the user already has a replica set assigned under creator_node_endpoint
    if (user.creator_node_endpoint && user.creator_node_endpoint.length > 0) return

    // The new metadata object that will contain the replica set
    let newMetadata
    try {
      // Create starter metadata and validate
      phase = phases.CLEAN_AND_VALIDATE_METADATA
      newMetadata = this._cleanUserMetadata({ ...user })
      this._validateUserMetadata(newMetadata)

      // Autoselect a new replica set and update the metadata object with new content node endpoints
      let primary, secondaries
      if (!newContentNodeEndpoints || newContentNodeEndpoints.length === 0) {
        phase = phases.AUTOSELECT_CONTENT_NODES
        const response = await serviceProvider.autoSelectCreatorNodes({
          performSyncCheck: false,
          whitelist: passList,
          blacklist: blockList
        })
        primary = response.primary
        secondaries = response.secondaries
        if (!primary || !secondaries || secondaries.length < numNodes - 1) {
          throw new Error(`Could not select a primary=${primary} and/or ${numNodes - 1} secondaries=${secondaries}`)
        }
        newContentNodeEndpoints = CreatorNode.buildEndpoint(primary, secondaries)
      }
      newMetadata.creator_node_endpoint = newContentNodeEndpoints

      // Update the new primary to the auto-selected primary
      phase = phases.SET_PRIMARY
      const newPrimary = CreatorNode.getPrimary(newContentNodeEndpoints)
      await this.creatorNode.setEndpoint(newPrimary)

      // In signUp(), a replica set is assigned before uploading profile images.
      // Should associate new metadata after profile photo upload.
      phase = phases.UPLOAD_METADATA_AND_UPDATE_ON_CHAIN
      await this._handleMetadata({
        newMetadata,
        userId
      })
    } catch (e) {
      throw new Error(`assignReplicaSet() Error -- Phase ${phase}: ${e}`)
    }

    return newMetadata
  }

  /**
   * Updates a creator (updates their data on the creator node)
   * @param {number} userId
   * @param {Object} metadata
   */
  async updateUserMetadata (userId, metadata) {
    await this._handleMetadata({
      newMetadata: metadata,
      userId
    })
    return userId
  }

  /**
   * Util to upload profile picture and cover photo images. Also updates a metadata object.
   * This method inherently calls triggerSecondarySyncs().
   * @param {?File} profilePictureFile an optional file to upload as the profile picture
   * @param {?File} coverPhotoFile an optional file to upload as the cover phtoo
   * @param {Object} metadata to update
   * @returns {Object} the passed in metadata object with profile_picture and cover_photo fields added
   */
  async uploadProfileImages (profilePictureFile, coverPhotoFile, metadata) {
    if (profilePictureFile) {
      const resp = await this.creatorNode.uploadImage(profilePictureFile, true)
      metadata.profile_picture_sizes = resp.dirCID
    }
    if (coverPhotoFile) {
      const resp = await this.creatorNode.uploadImage(coverPhotoFile, false)
      metadata.cover_photo_sizes = resp.dirCID
    }

    await this._handleMetadata({
      newMetadata: metadata,
      userId: metadata.user_id
    })
    return metadata
  }

  /**
   * Set is_creator field in metadata to true
   * @param {Object} userMetadata current user metadata
   */
  async upgradeToCreator (userMetadata) {
    userMetadata.is_creator = true
    await this._handleMetadata({
      newMetadata: userMetadata,
      userId: userMetadata.user_id
    })
    return userMetadata.user_id
  }

  /**
   * Updates a user on whether they are verified on Audius
   * @param {number} userId
   * @param {boolean} isVerified
   */
  async updateIsVerified (userId, isVerified, privateKey) {
    return this.contracts.UserFactoryClient.updateIsVerified(userId, isVerified, privateKey)
  }

  /**
   * Adds a user follow for a given follower and followee
   * @param {number} followerUserId who is following
   * @param {number} followeeUserId who is being followed...
  */
  async addUserFollow (followeeUserId) {
    const followerUserId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.addUserFollow(followerUserId, followeeUserId)
  }

  /**
   * Deletes a user follow for a given follower and followee
   * @param {number} followerUserId who is no longer following
   * @param {number} followeeUserId who is no longer being followed...
  */
  async deleteUserFollow (followeeUserId) {
    const followerUserId = this.userStateManager.getCurrentUserId()
    return this.contracts.SocialFeatureFactoryClient.deleteUserFollow(followerUserId, followeeUserId)
  }

  /**
   * Gets the clock status for user in userStateManager across replica set.
   */
  async getClockValuesFromReplicaSet () {
    return this.creatorNode.getClockValuesFromReplicaSet()
  }

  /* ------- PRIVATE  ------- */

  /**
   * 1. Uploads metadata to primary Content Node (which inherently calls a sync accross secondaries)
   * 2. Updates metadata on chain
   * @param {Object}
   */
  async _handleMetadata ({ newMetadata, userId }) {
    this.REQUIRES(Services.CREATOR_NODE, Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(newMetadata)
    const phases = {
      UPLOAD_METADATA: 'UPLOAD_METADATA',
      UPDATE_METADATA_ON_CHAIN: 'UPDATE_METADATA_ON_CHAIN',
      ASSOCIATE_USER: 'ASSOCIATE_USER'
    }
    let phase = ''

    const originalMetadata = this.userStateManager.getCurrentUser()
    if (!originalMetadata) { throw new Error('No current user.') }

    newMetadata = this._cleanUserMetadata(newMetadata)
    this._validateUserMetadata(newMetadata)

    // If the new metadata is the same as the original, it is a no-op and exit early
    const shouldUpdate = this._shouldUpdateUserStateManager(newMetadata)
    if (!shouldUpdate) { return }

    try {
      // Upload new metadata
      phase = phases.UPLOAD_METADATA
      const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadCreatorContent(
        newMetadata
      )
      // Update new metadata on chain
      let updatedMultihashDecoded = Utils.decodeMultihash(metadataMultihash)
      let { txReceipt } = await this.contracts.UserFactoryClient.updateMultihash(userId, updatedMultihashDecoded.digest)
      const { latestBlockNumber } = await this._updateUserOperations(newMetadata, originalMetadata, userId)
      if (newMetadata.creator_node_endpoint !== originalMetadata.creator_node_endpoint) {
        await this._waitForContentNodeEndpointUpdate(newMetadata.user_id, newMetadata.creator_node_endpoint)
      }

      // Re-associate the user id with the metadata and block number
      phase = phases.ASSOCIATE_USER
      await this.creatorNode.associateUser(userId, metadataFileUUID, Math.max(txReceipt.blockNumber, latestBlockNumber))

      this.userStateManager.updateCurrentUser(newMetadata)
    } catch (e) {
      // TODO: think about handling the update metadata on chain and associating..
      throw new Error(`_handleMetadata() Error -- Phase ${phase}: ${e}`)
    }
  }

  /**
 * Compares the original user state to an updated state. Determines if an update is necessary.
 * @param {Object} newMetadata fields to update in the current user state
 */
  _shouldUpdateUserStateManager (newMetadata) {
    const originalMetadata = this.userStateManager.getCurrentUser()
    const updatedMetadata = { ...originalMetadata, ...newMetadata }
    return JSON.stringify(originalMetadata) !== JSON.stringify(updatedMetadata)
  }

  /** Waits for a discovery provider to confirm that a creator node endpoint is updated. */
  async _waitForContentNodeEndpointUpdate (userId, creatorNodeEndpoint) {
    let isUpdated = false
    while (!isUpdated) {
      const user = (await this.discoveryProvider.getUsers(1, 0, [userId]))[0]
      if (user && user.creator_node_endpoint === creatorNodeEndpoint) isUpdated = true
      await Utils.wait(500)
    }
  }

  async _addUserOperations (userId, metadata) {
    let addOps = []

    if (metadata['name']) {
      addOps.push(this.contracts.UserFactoryClient.updateName(userId, metadata['name']))
    }
    if (metadata['location']) {
      addOps.push(this.contracts.UserFactoryClient.updateLocation(userId, metadata['location']))
    }
    if (metadata['bio']) {
      addOps.push(this.contracts.UserFactoryClient.updateBio(userId, metadata['bio']))
    }
    if (metadata['profile_picture_sizes']) {
      addOps.push(this.contracts.UserFactoryClient.updateProfilePhoto(
        userId,
        Utils.decodeMultihash(metadata['profile_picture_sizes']).digest
      ))
    }
    if (metadata['cover_photo_sizes']) {
      addOps.push(this.contracts.UserFactoryClient.updateCoverPhoto(
        userId,
        Utils.decodeMultihash(metadata['cover_photo_sizes']).digest
      ))
    }
    if (metadata['is_creator']) {
      addOps.push(this.contracts.UserFactoryClient.updateIsCreator(userId, metadata['is_creator']))
    }
    if (metadata['creator_node_endpoint']) {
      addOps.push(this.contracts.UserFactoryClient.updateCreatorNodeEndpoint(userId, metadata['creator_node_endpoint']))
    }

    // Execute update promises concurrently
    // TODO - what if one or more of these fails?
    const ops = await Promise.all(addOps)
    return { ops: ops, latestBlockNumber: Math.max(...ops.map(op => op.txReceipt.blockNumber)) }
  }

  async _updateUserOperations (metadata, currentMetadata, userId) {
    let updateOps = []

    // Compare the existing metadata with the new values and conditionally
    // perform update operations
    for (const key in metadata) {
      if (metadata.hasOwnProperty(key) && currentMetadata.hasOwnProperty(key) && metadata[key] !== currentMetadata[key]) {
        if (key === 'name') {
          updateOps.push(this.contracts.UserFactoryClient.updateName(userId, metadata['name']))
        }
        if (key === 'is_creator') {
          updateOps.push(this.contracts.UserFactoryClient.updateIsCreator(userId, metadata['is_creator']))
        }
        if (key === 'bio') {
          updateOps.push(this.contracts.UserFactoryClient.updateBio(userId, metadata['bio']))
        }
        if (key === 'location') {
          updateOps.push(this.contracts.UserFactoryClient.updateLocation(userId, metadata['location']))
        }
        if (key === 'profile_picture_sizes') {
          updateOps.push(this.contracts.UserFactoryClient.updateProfilePhoto(
            userId,
            Utils.decodeMultihash(metadata['profile_picture_sizes']).digest
          ))
        }
        if (key === 'cover_photo_sizes') {
          updateOps.push(this.contracts.UserFactoryClient.updateCoverPhoto(
            userId,
            Utils.decodeMultihash(metadata['cover_photo_sizes']).digest
          ))
        }
        if (key === 'creator_node_endpoint') {
          updateOps.push(this.contracts.UserFactoryClient.updateCreatorNodeEndpoint(userId, metadata['creator_node_endpoint']))
        }
      }
    }

    const ops = await Promise.all(updateOps)
    return { ops: ops, latestBlockNumber: Math.max(...ops.map(op => op.txReceipt.blockNumber)) }
  }

  _validateUserMetadata (metadata) {
    this.OBJECT_HAS_PROPS(metadata, USER_PROPS, USER_REQUIRED_PROPS)
  }

  _cleanUserMetadata (metadata) {
    return pick(metadata, USER_PROPS.concat('user_id'))
  }
}

module.exports = Users
