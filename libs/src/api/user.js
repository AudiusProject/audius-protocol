const { pick } = require('lodash')
const { Base, Services } = require('./base')
const Utils = require('../utils')
const CreatorNode = require('../services/creatorNode')
const { getSpIDFromEndpoint } = require('../services/creatorNode/CreatorNodeSelection')


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
    this.updateUser = this.updateUser.bind(this)
    this.addCreator = this.addCreator.bind(this)
    this.updateCreator = this.updateCreator.bind(this)
    this.upgradeToCreator = this.upgradeToCreator.bind(this)
    this.updateIsVerified = this.updateIsVerified.bind(this)
    this.addUserFollow = this.addUserFollow.bind(this)
    this.deleteUserFollow = this.deleteUserFollow.bind(this)
    this.getClockValuesFromReplicaSet = this.getClockValuesFromReplicaSet.bind(this)
    this._waitForCreatorNodeEndpointIndexing = this._waitForCreatorNodeEndpointIndexing.bind(this)
    this._addUserOperations = this._addUserOperations.bind(this)
    this._updateUserOperations = this._updateUserOperations.bind(this)
    this._validateUserMetadata = this._validateUserMetadata.bind(this)
    this._cleanUserMetadata = this._cleanUserMetadata.bind(this)
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
   * Util to upload profile picture and cover photo images and update
   * a metadata object
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
    return metadata
  }

  /**
   * Create an on-chain non-creator user. Some fields are restricted (ex.
   * creator_node_endpoint); this should error if the metadata given attempts to set them.
   * @param {Object} metadata metadata to associate with the user
   */
  async addUser (metadata) {
    this.IS_OBJECT(metadata)
    const newMetadata = this._cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    newMetadata.wallet = this.web3Manager.getWalletAddress()

    let userId
    const currentUser = this.userStateManager.getCurrentUser()
    if (currentUser && currentUser.handle) {
      userId = currentUser.user_id
    } else {
      userId = (await this.contracts.UserFactoryClient.addUser(newMetadata.handle)).userId
    }
    await this._addUserOperations(userId, newMetadata)

    this.userStateManager.setCurrentUser({ ...newMetadata })
    return userId
  }

  /**
   * Updates a user
   * @param {number} userId
   * @param {Object} metadata
   */
  async updateUser (userId, metadata) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(metadata)
    const newMetadata = this._cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    // Retrieve the current user metadata
    let users = await this.discoveryProvider.getUsers(1, 0, [userId], null, null, false, null)
    if (!users || !users[0]) throw new Error(`Cannot update user because no current record exists for user id ${userId}`)

    const oldMetadata = users[0]
    await this._updateUserOperations(newMetadata, oldMetadata, userId)
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })
  }

  /**
   * Create a new user that is a creator or upgrade from a non-creator user to a creator
   * Fills in wallet and creator_node_endpoint fields in metadata.
   *
   * @notice - this function is most likely not used and can be removed
   *
   * @param {Object} metadata - metadata to associate with the user, following the format in `user-metadata-format.json` in audius-contracts.
   */
  async addCreator (metadata) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.IS_OBJECT(metadata)
    const newMetadata = this._cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    // Error if libs instance already has user - we only support one user per creator node / libs instance
    const user = this.userStateManager.getCurrentUser()
    if (user) {
      throw new Error('User already created for creator node / libs instance')
    }

    // populate metadata object with required fields - wallet, is_creator, creator_node_endpoint
    newMetadata.wallet = this.web3Manager.getWalletAddress()
    newMetadata.is_creator = true
    newMetadata.creator_node_endpoint = this.creatorNode.getEndpoint()

    // Create user record on chain with handle
    const { userId } = await this.contracts.UserFactoryClient.addUser(newMetadata.handle)

    // Update user creator_node_endpoint on chain
    await this._updateReplicaSet(userId, newMetadata)

    // Upload metadata object to CN
    const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadCreatorContent(newMetadata)

    // Write metadata multihash to chain
    const multihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const { txReceipt } = await this.contracts.UserFactoryClient.updateMultihash(userId, multihashDecoded.digest)

    // Write remaining metadata fields to chain
    const { latestBlockNumber } = await this._addUserOperations(userId, newMetadata)

    // Write to CN to associate blockchain user id with the metadata and block number
    await this.creatorNode.associateCreator(userId, metadataFileUUID, Math.max(txReceipt.blockNumber, latestBlockNumber))

    // Update libs instance with new user metadata object
    this.userStateManager.setCurrentUser({ ...newMetadata })

    return userId
  }

  /**
   * Updates a creator (updates their data on the creator node)
   * @param {number} userId
   * @param {Object} metadata
   */
  async updateCreator (userId, metadata) {
    this.REQUIRES(Services.CREATOR_NODE, Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(metadata)
    const newMetadata = this._cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    // Error if libs instance does not already have existing user state
    const user = this.userStateManager.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    // Ensure libs is connected to correct CN
    if (this.creatorNode.getEndpoint() !== CreatorNode.getPrimary(newMetadata['creator_node_endpoint'])) {
      throw new Error(`Not connected to correct content node. Expected ${CreatorNode.getPrimary(newMetadata['creator_node_endpoint'])}, got ${this.creatorNode.getEndpoint()}`)
    }

    // Preserve old metadata object
    const oldMetadata = { ...user }

    console.log(`Updating from ${oldMetadata.creator_node_endpoint}`)
    console.log(`Updating to ${newMetadata.creator_node_endpoint}`)

    // Update user creator_node_endpoint on chain if applicable
    let updateEndpointTxBlockNumber = null
    if (newMetadata.creator_node_endpoint !== oldMetadata.creator_node_endpoint) {
      // Perform update to new contract
      const updateEndpointTxReceipt = await this._updateReplicaSet(userId, newMetadata)
      updateEndpointTxBlockNumber = updateEndpointTxReceipt.blockNumber

      // Ensure DN has indexed creator_node_endpoint change
      await this._waitForCreatorNodeEndpointIndexing(
        newMetadata.user_id,
        newMetadata.creator_node_endpoint
      )
    }

    // Upload new metadata object to CN
    const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadCreatorContent(newMetadata, updateEndpointTxBlockNumber)

    // Write metadata multihash to chain
    const updatedMultihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const { txReceipt } = await this.contracts.UserFactoryClient.updateMultihash(userId, updatedMultihashDecoded.digest)

    // Write remaining metadata fields to chain
    const { latestBlockNumber } = await this._updateUserOperations(newMetadata, oldMetadata, userId)

    // Write to CN to associate blockchain user id with updated metadata and block number
    await this.creatorNode.associateCreator(userId, metadataFileUUID, Math.max(txReceipt.blockNumber, latestBlockNumber))

    // Update libs instance with new user metadata object
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })

    return userId
  }

  /**
   * Upgrades a user to a creator using their metadata object.
   * This creates a record for that user on the connected creator node.
   * @param {string} existingEndpoint
   * @param {string} newCreatorNodeEndpoint comma delineated
   */
  async upgradeToCreator (existingEndpoint, newCreatorNodeEndpoint) {
    this.REQUIRES(Services.CREATOR_NODE)

    if (!newCreatorNodeEndpoint) throw new Error(`No creator node endpoint provided`)

    // Error if libs instance does not already have existing user state
    const user = this.userStateManager.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    // No-op if the user is already a creator.
    // Consider them a creator iff they have is_creator=true AND a creator node endpoint
    if (user.is_creator && user.creator_node_endpoint) return

    const userId = user.user_id
    const oldMetadata = { ...user }

    // Clean and validate metadata
    const newMetadata = this._cleanUserMetadata({ ...user })
    this._validateUserMetadata(newMetadata)

    // Populate metadata with required fields - wallet, is_creator, creator_node_endpoint
    newMetadata.wallet = this.web3Manager.getWalletAddress()
    newMetadata.is_creator = true
    newMetadata.creator_node_endpoint = newCreatorNodeEndpoint

    const newPrimary = CreatorNode.getPrimary(newCreatorNodeEndpoint)

    // Sync user data from old primary to new endpoint
    if (existingEndpoint) {
      // Don't validate what we're syncing from because the user isn't
      // a creator yet.
      await this.creatorNode.syncSecondary(
        newPrimary,
        existingEndpoint,
        /* immediate= */ true,
        /* validate= */ false
      )
    }

    // Update local libs state with new CN endpoint
    await this.creatorNode.setEndpoint(newPrimary)

    // Update user creator_node_endpoint on chain if applicable
    let updateEndpointTxBlockNumber = null
    if (newMetadata.creator_node_endpoint !== oldMetadata.creator_node_endpoint) {
      let updateTx = await this._updateReplicaSet(userId, newMetadata)
      updateEndpointTxBlockNumber = updateTx.blockNumber

      // Ensure DN has indexed creator_node_endpoint change
      await this._waitForCreatorNodeEndpointIndexing(
        newMetadata.user_id,
        newMetadata.creator_node_endpoint,
        newMetadata.handle
      )
    }

    // Upload new metadata object to CN
    const { metadataMultihash, metadataFileUUID } = await this.creatorNode.uploadCreatorContent(newMetadata, updateEndpointTxBlockNumber)

    // Write metadata multihash to chain
    const updatedMultihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const { txReceipt } = await this.contracts.UserFactoryClient.updateMultihash(userId, updatedMultihashDecoded.digest)

    // Write remaining metadata fields to chain
    const { latestBlockNumber } = await this._updateUserOperations(newMetadata, oldMetadata, userId)

    // Write to CN to associate blockchain user id with updated metadata and block number
    await this.creatorNode.associateCreator(userId, metadataFileUUID, Math.max(txReceipt.blockNumber, latestBlockNumber))

    // Update libs instance with new user metadata object
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })

    return userId
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

  /** Waits for a discovery provider to confirm that a creator node endpoint is updated. */
  async _waitForCreatorNodeEndpointIndexing (userId, creatorNodeEndpoint) {
    let isUpdated = false
    while (!isUpdated) {
      const user = (await this.discoveryProvider.getUsers(1, 0, [userId]))[0]
      console.log(`found ${user.creator_node_endpoint}, expected ${creatorNodeEndpoint}`)
      if (user.creator_node_endpoint === creatorNodeEndpoint) isUpdated = true
      await Utils.wait(500)
    }
  }

  async _addUserOperations (userId, newMetadata, exclude = []) {
    let addOps = []

    // Remove excluded keys from metadata object
    let metadata = { ...newMetadata }
    exclude.map(excludedKey => delete metadata[excludedKey])

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

    // Execute update promises concurrently
    // TODO - what if one or more of these fails?
    const ops = await Promise.all(addOps)
    return { ops: ops, latestBlockNumber: Math.max(...ops.map(op => op.txReceipt.blockNumber)) }
  }

  async _updateUserOperations (newMetadata, currentMetadata, userId, exclude = []) {
    let updateOps = []

    // Remove excluded keys from metadata object
    let metadata = { ...newMetadata }
    exclude.map(excludedKey => delete metadata[excludedKey])
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
      }
    }

    const ops = await Promise.all(updateOps)
    const latestBlockNumber = Math.max(...ops.map(op => op.txReceipt.blockNumber))

    return { ops: ops, latestBlockNumber }
  }

  _validateUserMetadata (metadata) {
    this.OBJECT_HAS_PROPS(metadata, USER_PROPS, USER_REQUIRED_PROPS)
  }

  _cleanUserMetadata (metadata) {
    return pick(metadata, USER_PROPS.concat('user_id'))
  }

  async _updateReplicaSet(userId, metadata) {
    let primaryEndpoint = CreatorNode.getPrimary(metadata['creator_node_endpoint'])
    let secondaries = CreatorNode.getSecondaries(metadata['creator_node_endpoint'])
    let primarySpID = await this._retrieveSpIDFromEndpoint(primaryEndpoint)
    let secondary1SpID = await this._retrieveSpIDFromEndpoint(secondaries[0])
    let secondary2SpID = await this._retrieveSpIDFromEndpoint(secondaries[1])
    // Update in new contract
    let tx = await this.contracts.UserReplicaSetManagerClient.updateReplicaSet(
      userId,
      primarySpID,
      [secondary1SpID, secondary2SpID]
    )
    return tx
  }

  async _retrieveSpIDFromEndpoint (endpoint) {
    let cachedSpID = await getSpIDFromEndpoint(endpoint)
    let spID = cachedSpID
    if (!spID) {
      let spEndpointInfo = await this.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromEndpoint(
        endpoint
      )
      spID = spEndpointInfo.spID
    }
    return spID
  }
}

module.exports = Users
