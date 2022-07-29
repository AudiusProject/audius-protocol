import { pick, isEqual } from 'lodash'
import { Base, BaseConstructorArgs, Services } from './base'
import { Nullable, UserMetadata, Utils } from '../utils'
import {
  CreatorNode,
  getSpIDForEndpoint,
  setSpIDForEndpoint
} from '../services/creatorNode'
import type { ServiceProvider } from './ServiceProvider'

// User metadata fields that are required on the metadata object and can have
// null or non-null values
const USER_PROPS = [
  'is_verified',
  'is_deactivated',
  'name',
  'handle',
  'profile_picture',
  'profile_picture_sizes',
  'cover_photo',
  'cover_photo_sizes',
  'bio',
  'location',
  'creator_node_endpoint',
  'associated_wallets',
  'associated_sol_wallets',
  'collectibles',
  'playlist_library',
  'events'
] as Array<keyof UserMetadata>
// User metadata fields that are required on the metadata object and only can have
// non-null values
const USER_REQUIRED_PROPS = ['name', 'handle']
// Constants for user metadata fields

export class Users extends Base {
  ServiceProvider: ServiceProvider
  preferHigherPatchForPrimary: boolean
  preferHigherPatchForSecondaries: boolean
  constructor(
    serviceProvider: ServiceProvider,
    preferHigherPatchForPrimary: boolean,
    preferHigherPatchForSecondaries: boolean,
    ...args: BaseConstructorArgs
  ) {
    super(...args)

    this.ServiceProvider = serviceProvider
    this.preferHigherPatchForPrimary = preferHigherPatchForPrimary
    this.preferHigherPatchForSecondaries = preferHigherPatchForSecondaries

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
    this.updateCreator = this.updateCreator.bind(this)
    this.updateIsVerified = this.updateIsVerified.bind(this)
    this.addUserFollow = this.addUserFollow.bind(this)
    this.deleteUserFollow = this.deleteUserFollow.bind(this)

    // For adding replica set to users on sign up
    this.assignReplicaSet = this.assignReplicaSet.bind(this)

    this.getClockValuesFromReplicaSet =
      this.getClockValuesFromReplicaSet.bind(this)
    this._waitForCreatorNodeEndpointIndexing =
      this._waitForCreatorNodeEndpointIndexing.bind(this)
    this._addUserOperations = this._addUserOperations.bind(this)
    this._updateUserOperations = this._updateUserOperations.bind(this)
    this._validateUserMetadata = this._validateUserMetadata.bind(this)
    this.cleanUserMetadata = this.cleanUserMetadata.bind(this)

    // For adding a creator_node_endpoint for a user if null
    this.assignReplicaSetIfNecessary =
      this.assignReplicaSetIfNecessary.bind(this)
  }

  /* ----------- GETTERS ---------- */

  /**
   * get users with all relevant user data
   * can be filtered by providing an integer array of ids
   * @returns Array of User metadata Objects
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
  async getUsers(
    limit = 100,
    offset = 0,
    idsArray: Nullable<number[]> = null,
    walletAddress: Nullable<string> = null,
    handle: Nullable<string> = null,
    minBlockNumber: Nullable<number> = null
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getUsers(
      limit,
      offset,
      idsArray,
      walletAddress,
      handle,
      minBlockNumber
    )
  }

  /**
   * get intersection of users that follow followeeUserId and users that are followed by followerUserId
   * @param followeeUserId user that is followed
   * @example
   * getMutualFollowers(100, 0, 1, 1) - IDs must be valid
   */
  async getMutualFollowers(limit = 100, offset = 0, followeeUserId: number) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    const followerUserId = this.userStateManager.getCurrentUserId()
    if (followerUserId) {
      return await this.discoveryProvider.getFollowIntersectionUsers(
        limit,
        offset,
        followeeUserId,
        followerUserId
      )
    }
    return []
  }

  /**
   * get users that follow followeeUserId, sorted by follower count descending
   */
  async getFollowersForUser(limit = 100, offset = 0, followeeUserId: string) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getFollowersForUser(
      limit,
      offset,
      followeeUserId
    )
  }

  /**
   * get users that are followed by followerUserId, sorted by follower count descending
   */
  async getFolloweesForUser(limit = 100, offset = 0, followerUserId: string) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getFolloweesForUser(
      limit,
      offset,
      followerUserId
    )
  }

  /**
   * Return repost feed for requested user
   * @param userId - requested user id
   * @param limit - max # of items to return (for pagination)
   * @param offset - offset into list to return from (for pagination)
   * @returns Array of track and playlist metadata objects
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getUserRepostFeed(
    userId: number,
    limit = 100,
    offset = 0,
    withUsers = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getUserRepostFeed(
      userId,
      limit,
      offset,
      withUsers
    )
  }

  /**
   * Return social feed for current user
   * @param limit - max # of items to return
   * @param filter - filter by "all", "original", or "repost"
   * @param offset - offset into list to return from (for pagination)
   * @returns Array of track and playlist metadata objects
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getSocialFeed(
    filter: string,
    limit = 100,
    offset = 0,
    withUsers = false,
    tracksOnly = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    const owner = this.userStateManager.getCurrentUser()
    if (owner) {
      return await this.discoveryProvider.getSocialFeed(
        filter,
        limit,
        offset,
        withUsers,
        tracksOnly
      )
    }

    return []
  }

  /**
   * Returns the top users for the specified genres
   * @param genres - filter by genres ie. "Rock", "Alternative"
   * @param limit - max # of items to return
   * @param offset - offset into list to return from (for pagination)
   * @param withUsers - If the userIds should be returned or the full user metadata
   * @returns  Array of user objects if with_users set, else array of userId
   */
  async getTopCreatorsByGenres(
    genres: string[],
    limit = 30,
    offset = 0,
    withUsers = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getTopCreatorsByGenres(
      genres,
      limit,
      offset,
      withUsers
    )
  }

  /* ------- SETTERS ------- */

  /**
   * Assigns a replica set to the user's metadata and adds new metadata to chain.
   * This creates a record for that user on the connected creator node.
   */
  async assignReplicaSet({ userId }: { userId: number }) {
    this.REQUIRES(Services.CREATOR_NODE)
    const phases = {
      CLEAN_AND_VALIDATE_METADATA: 'CLEAN_AND_VALIDATE_METADATA',
      AUTOSELECT_CONTENT_NODES: 'AUTOSELECT_CONTENT_NODES',
      SYNC_ACROSS_CONTENT_NODES: 'SYNC_ACROSS_CONTENT_NODES',
      SET_PRIMARY: 'SET_PRIMARY',
      UPLOAD_METADATA_AND_UPDATE_ON_CHAIN: 'UPLOAD_METADATA_AND_UPDATE_ON_CHAIN'
    }
    let phase = ''

    const logPrefix = `[User:assignReplicaSet()] [userId: ${userId}]`
    const fnStartMs = Date.now()
    let startMs = fnStartMs

    const user = this.userStateManager.getCurrentUser()
    // Failed the addUser() step
    if (!user) {
      throw new Error('No current user')
    }
    // No-op if the user already has a replica set assigned under creator_node_endpoint
    if (user.creator_node_endpoint && user.creator_node_endpoint.length > 0)
      return

    // The new metadata object that will contain the replica set
    const newMetadata = { ...user }
    try {
      // Create starter metadata and validate
      phase = phases.CLEAN_AND_VALIDATE_METADATA

      // Autoselect a new replica set and update the metadata object with new content node endpoints
      phase = phases.AUTOSELECT_CONTENT_NODES
      const response = await this.ServiceProvider.autoSelectCreatorNodes({
        performSyncCheck: false,
        preferHigherPatchForPrimary: this.preferHigherPatchForPrimary,
        preferHigherPatchForSecondaries: this.preferHigherPatchForSecondaries
      })
      console.log(
        `${logPrefix} [phase: ${phase}] ServiceProvider.autoSelectCreatorNodes() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      // Ideally, 1 primary and n-1 secondaries are chosen. The best-worst case scenario is that at least 1 primary
      // is chosen. If a primary was not selected (which also implies that secondaries were not chosen), throw
      // an error.
      const { primary, secondaries } = response
      if (!primary) {
        throw new Error('Could not select a primary.')
      }

      const newContentNodeEndpoints = CreatorNode.buildEndpoint(
        primary,
        secondaries
      )
      newMetadata.creator_node_endpoint = newContentNodeEndpoints

      // Update the new primary to the auto-selected primary
      phase = phases.SET_PRIMARY
      await this.creatorNode.setEndpoint(primary)

      // Update metadata in CN and on chain of newly assigned replica set
      phase = phases.UPLOAD_METADATA_AND_UPDATE_ON_CHAIN
      await this.updateAndUploadMetadata({
        newMetadata,
        userId
      })
      console.log(
        `${logPrefix} [phase: ${phase}] updateAndUploadMetadata() completed in ${
          Date.now() - startMs
        }ms`
      )

      console.log(`${logPrefix} completed in ${Date.now() - fnStartMs}ms`)
    } catch (e) {
      const errorMsg = `assignReplicaSet() Error -- Phase ${phase} in ${
        Date.now() - fnStartMs
      }ms: ${e}`
      console.log(errorMsg)
      throw new Error(errorMsg)
    }

    return newMetadata
  }

  /**
   * Util to upload profile picture and cover photo images and update
   * a metadata object. This method inherently calls triggerSecondarySyncs().
   * @param profilePictureFile an optional file to upload as the profile picture
   * @param coverPhotoFile an optional file to upload as the cover photo
   * @param metadata to update
   * @returns the passed in metadata object with profile_picture_sizes and cover_photo_sizes fields added
   */
  async uploadProfileImages(
    profilePictureFile: File,
    coverPhotoFile: File,
    metadata: UserMetadata
  ) {
    let didMetadataUpdate = false
    if (profilePictureFile) {
      const resp = await this.creatorNode.uploadImage(profilePictureFile, true)
      metadata.profile_picture_sizes = resp.dirCID
      didMetadataUpdate = true
    }
    if (coverPhotoFile) {
      const resp = await this.creatorNode.uploadImage(coverPhotoFile, false)
      metadata.cover_photo_sizes = resp.dirCID
      didMetadataUpdate = true
    }

    if (didMetadataUpdate) {
      await this.updateAndUploadMetadata({
        newMetadata: metadata,
        userId: metadata.user_id
      })
    }

    return metadata
  }

  /**
   * Create an on-chain non-creator user. Some fields are restricted (ex.
   * creator_node_endpoint); this should error if the metadata given attempts to set them.
   * @param {Object} metadata metadata to associate with the user
   */
  async addUser(metadata: UserMetadata) {
    this.IS_OBJECT(metadata)
    const newMetadata = this.cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    let userId
    const currentUser = this.userStateManager.getCurrentUser()
    if (currentUser?.handle) {
      userId = currentUser.user_id
    } else {
      userId = (
        await this.contracts.UserFactoryClient.addUser(newMetadata.handle)
      ).userId
    }
    const { latestBlockHash: blockHash, latestBlockNumber: blockNumber } =
      await this._addUserOperations(userId, newMetadata)

    newMetadata.wallet = this.web3Manager.getWalletAddress()
    newMetadata.user_id = userId

    this.userStateManager.setCurrentUser({
      ...newMetadata,
      // Initialize counts to be 0. We don't want to write this data to backends ever really
      // (hence the cleanUserMetadata above), but we do want to make sure clients
      // can properly "do math" on these numbers.
      followee_count: 0,
      follower_count: 0,
      repost_count: 0
    })
    return { blockHash, blockNumber, userId }
  }

  /**
   * Updates a user
   */
  async updateUser(userId: number, metadata: UserMetadata) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(metadata)
    const newMetadata = this.cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    // Retrieve the current user metadata
    const users = await this.discoveryProvider.getUsers(
      1,
      0,
      [userId],
      null,
      null,
      null
    )
    if (!users || !users[0])
      throw new Error(
        `Cannot update user because no current record exists for user id ${userId}`
      )

    const oldMetadata = users[0]
    const { latestBlockHash: blockHash, latestBlockNumber: blockNumber } =
      await this._updateUserOperations(newMetadata, oldMetadata, userId)
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })
    return { blockHash, blockNumber }
  }

  /**
   * Updates a creator (updates their data on the creator node)
   */
  async updateCreator(userId: number, metadata: UserMetadata) {
    this.REQUIRES(Services.CREATOR_NODE, Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(metadata)
    const newMetadata = this.cleanUserMetadata(metadata)
    this._validateUserMetadata(newMetadata)

    const logPrefix = `[User:updateCreator()] [userId: ${userId}]`
    const fnStartMs = Date.now()
    let startMs = fnStartMs

    // Error if libs instance does not already have existing user state
    const user = this.userStateManager.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    // Ensure libs is connected to correct CN
    if (
      this.creatorNode.getEndpoint() !==
      CreatorNode.getPrimary(newMetadata.creator_node_endpoint!)
    ) {
      throw new Error(
        `Not connected to correct content node. Expected ${CreatorNode.getPrimary(
          newMetadata.creator_node_endpoint!
        )}, got ${this.creatorNode.getEndpoint()}`
      )
    }

    // Preserve old metadata object
    const oldMetadata = { ...user }

    // Update user creator_node_endpoint on chain if applicable
    let updateEndpointTxBlockNumber = null
    if (
      newMetadata.creator_node_endpoint !== oldMetadata.creator_node_endpoint
    ) {
      // Perform update to new contract
      startMs = Date.now()
      const { txReceipt: updateEndpointTxReceipt, replicaSetSPIDs } =
        await this._updateReplicaSetOnChain(
          userId,
          newMetadata.creator_node_endpoint!
        )
      updateEndpointTxBlockNumber = updateEndpointTxReceipt?.blockNumber
      console.log(
        `${logPrefix} _updateReplicaSetOnChain() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      await this._waitForURSMCreatorNodeEndpointIndexing(
        userId,
        replicaSetSPIDs
      )
      console.log(
        `${logPrefix} _waitForURSMCreatorNodeEndpointIndexing() completed in ${
          Date.now() - startMs
        }ms`
      )
    }

    // Upload new metadata object to CN
    const { metadataMultihash, metadataFileUUID } =
      await this.creatorNode.uploadCreatorContent(
        // @ts-expect-error pretty tough one to type
        newMetadata,
        updateEndpointTxBlockNumber
      )

    // Write metadata multihash to chain
    const updatedMultihashDecoded = Utils.decodeMultihash(metadataMultihash)
    const { txReceipt } =
      await this.contracts.UserFactoryClient.updateMultihash(
        userId,
        updatedMultihashDecoded.digest
      )

    // Write remaining metadata fields to chain
    let { latestBlockHash, latestBlockNumber } =
      await this._updateUserOperations(newMetadata, oldMetadata, userId)

    // Write to CN to associate blockchain user id with updated metadata and block number
    await this.creatorNode.associateCreator(
      userId,
      metadataFileUUID,
      Math.max(txReceipt.blockNumber, latestBlockNumber)
    )

    // Update libs instance with new user metadata object
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })

    if (!latestBlockHash || !latestBlockNumber) {
      latestBlockHash = txReceipt.blockHash
      latestBlockNumber = txReceipt.blockNumber
    }

    return {
      blockHash: latestBlockHash,
      blockNumber: latestBlockNumber,
      userId
    }
  }

  /**
   * Updates a user on whether they are verified on Audius
   */
  async updateIsVerified(
    userId: number,
    isVerified: boolean,
    privateKey: string
  ) {
    return await this.contracts.UserFactoryClient.updateIsVerified(
      userId,
      isVerified,
      privateKey
    )
  }

  /**
   * Adds a user follow for a given follower and followee
   */
  async addUserFollow(followeeUserId: number) {
    const followerUserId = this.userStateManager.getCurrentUserId()
    return await this.contracts.SocialFeatureFactoryClient.addUserFollow(
      followerUserId!,
      followeeUserId
    )
  }

  /**
   * Deletes a user follow for a given follower and followee
   */
  async deleteUserFollow(followeeUserId: number) {
    const followerUserId = this.userStateManager.getCurrentUserId()
    return await this.contracts.SocialFeatureFactoryClient.deleteUserFollow(
      followerUserId!,
      followeeUserId
    )
  }

  /**
   * Gets the clock status for user in userStateManager across replica set.
   */
  async getClockValuesFromReplicaSet() {
    return await this.creatorNode.getClockValuesFromReplicaSet()
  }

  /* ------- PRIVATE  ------- */

  /**
   * 1. Uploads metadata to primary Content Node (which inherently calls a sync accross secondaries)
   * 2. Updates metadata on chain
   */
  async updateAndUploadMetadata({
    newMetadata,
    userId
  }: {
    newMetadata: UserMetadata
    userId: number
  }) {
    this.REQUIRES(Services.CREATOR_NODE, Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(newMetadata)
    const phases = {
      UPDATE_CONTENT_NODE_ENDPOINT_ON_CHAIN:
        'UPDATE_CONTENT_NODE_ENDPOINT_ON_CHAIN',
      UPLOAD_METADATA: 'UPLOAD_METADATA',
      UPDATE_METADATA_ON_CHAIN: 'UPDATE_METADATA_ON_CHAIN',
      UPDATE_USER_ON_CHAIN_OPS: 'UPDATE_USER_ON_CHAIN_OPS',
      ASSOCIATE_USER: 'ASSOCIATE_USER'
    }
    let phase = ''

    const oldMetadata = this.userStateManager.getCurrentUser()
    if (!oldMetadata) {
      throw new Error('No current user.')
    }

    newMetadata = this.cleanUserMetadata(newMetadata)
    this._validateUserMetadata(newMetadata)

    const logPrefix = `[User:updateAndUploadMetadata()] [userId: ${userId}]`
    const fnStartMs = Date.now()
    let startMs = fnStartMs

    try {
      // Update user creator_node_endpoint on chain if applicable
      if (
        newMetadata.creator_node_endpoint !== oldMetadata.creator_node_endpoint
      ) {
        phase = phases.UPDATE_CONTENT_NODE_ENDPOINT_ON_CHAIN
        const { replicaSetSPIDs } = await this._updateReplicaSetOnChain(
          userId,
          newMetadata.creator_node_endpoint!
        )
        console.log(
          `${logPrefix} [phase: ${phase}] _updateReplicaSetOnChain() completed in ${
            Date.now() - startMs
          }ms`
        )
        startMs = Date.now()

        await this._waitForURSMCreatorNodeEndpointIndexing(
          userId,
          replicaSetSPIDs
        )
        console.log(
          `${logPrefix} [phase: ${phase}] _waitForURSMCreatorNodeEndpointIndexing() completed in ${
            Date.now() - startMs
          }ms`
        )
      }

      // Upload new metadata object to CN
      phase = phases.UPLOAD_METADATA
      const { metadataMultihash, metadataFileUUID } =
        // @ts-expect-error tough converting UserMetadata to Metadata
        await this.creatorNode.uploadCreatorContent(newMetadata)
      console.log(
        `${logPrefix} [phase: ${phase}] creatorNode.uploadCreatorContent() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      // Write metadata multihash to chain
      phase = phases.UPDATE_METADATA_ON_CHAIN
      const updatedMultihashDecoded = Utils.decodeMultihash(metadataMultihash)
      const { txReceipt } =
        await this.contracts.UserFactoryClient.updateMultihash(
          userId,
          updatedMultihashDecoded.digest
        )
      console.log(
        `${logPrefix} [phase: ${phase}] UserFactoryClient.updateMultihash() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      // Write remaining metadata fields to chain
      phase = phases.UPDATE_USER_ON_CHAIN_OPS
      const { latestBlockNumber } = await this._updateUserOperations(
        newMetadata,
        oldMetadata,
        userId,
        ['creator_node_endpoint']
      )
      console.log(
        `${logPrefix} [phase: ${phase}] _updateUserOperations() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      // Write to CN to associate blockchain user id with updated metadata and block number
      phase = phases.ASSOCIATE_USER
      await this.creatorNode.associateCreator(
        userId,
        metadataFileUUID,
        Math.max(txReceipt.blockNumber, latestBlockNumber)
      )
      console.log(
        `${logPrefix} [phase: ${phase}] creatorNode.associateCreator() completed in ${
          Date.now() - startMs
        }ms`
      )
      startMs = Date.now()

      // Update libs instance with new user metadata object
      this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })

      console.log(`${logPrefix} completed in ${Date.now() - fnStartMs}ms`)
    } catch (e) {
      // TODO: think about handling the update metadata on chain and associating..
      const errorMsg = `updateAndUploadMetadata() Error -- Phase ${phase} in ${
        Date.now() - fnStartMs
      }ms: ${e}`
      console.log(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * If a user's creator_node_endpoint is null, assign a replica set.
   * Used during the sanity check and in uploadImage() in files.js
   */
  async assignReplicaSetIfNecessary() {
    const user = this.userStateManager.getCurrentUser()

    // If no user is logged in, or a creator node endpoint is already assigned,
    // skip this call
    if (!user || user.creator_node_endpoint) return

    // Generate a replica set and assign to user
    try {
      await this.assignReplicaSet({ userId: user.user_id })
    } catch (e) {
      throw new Error(
        `assignReplicaSetIfNecessary error - ${(e as any).toString()}`
      )
    }
  }

  /** Waits for a discovery provider to confirm that a creator node endpoint is updated. */
  async _waitForCreatorNodeEndpointIndexing(
    userId: number,
    creatorNodeEndpoint: string
  ) {
    while (true) {
      const userList = await this.discoveryProvider.getUsers(1, 0, [userId])
      if (userList) {
        const user = userList[0]
        if (user && user.creator_node_endpoint === creatorNodeEndpoint) {
          break
        }
      }

      await Utils.wait(500)
    }
  }

  async _waitForURSMCreatorNodeEndpointIndexing(
    userId: number,
    replicaSetSPIDs: number[],
    timeoutMs = 60000
  ) {
    const asyncFn = async () => {
      while (true) {
        const replicaSet =
          await this.contracts.UserReplicaSetManagerClient?.getUserReplicaSet(
            userId
          )
        if (
          replicaSet &&
          Object.prototype.hasOwnProperty.call(replicaSet, 'primaryId') &&
          Object.prototype.hasOwnProperty.call(replicaSet, 'secondaryIds') &&
          replicaSet.primaryId === replicaSetSPIDs[0] &&
          isEqual(replicaSet.secondaryIds, replicaSetSPIDs.slice(1, 3))
        ) {
          break
        }
      }
      await Utils.wait(500)
    }
    await Utils.racePromiseWithTimeout(
      asyncFn(),
      timeoutMs,
      `[User:_waitForURSMCreatorNodeEndpointIndexing()] Timeout error after ${timeoutMs}ms`
    )
  }

  async _addUserOperations(
    userId: number,
    newMetadata: UserMetadata,
    exclude = []
  ) {
    const addOps = []

    // Remove excluded keys from metadata object
    const metadata = { ...newMetadata }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    exclude.map((excludedKey) => delete metadata[excludedKey])

    if (metadata.name) {
      addOps.push(
        this.contracts.UserFactoryClient.updateName(userId, metadata.name)
      )
    }
    if (metadata.location) {
      addOps.push(
        this.contracts.UserFactoryClient.updateLocation(
          userId,
          metadata.location
        )
      )
    }
    if (metadata.bio) {
      addOps.push(
        this.contracts.UserFactoryClient.updateBio(userId, metadata.bio)
      )
    }
    if (metadata.profile_picture_sizes) {
      addOps.push(
        this.contracts.UserFactoryClient.updateProfilePhoto(
          userId,
          Utils.decodeMultihash(metadata.profile_picture_sizes).digest
        )
      )
    }
    if (metadata.cover_photo_sizes) {
      addOps.push(
        this.contracts.UserFactoryClient.updateCoverPhoto(
          userId,
          Utils.decodeMultihash(metadata.cover_photo_sizes).digest
        )
      )
    }

    let ops
    let latestBlockNumber = -Infinity
    let latestBlockHash
    if (addOps.length > 0) {
      // Execute update promises concurrently
      // TODO - what if one or more of these fails?
      // sort transactions by blocknumber and return most recent transaction
      ops = await Promise.all(addOps)
      const sortedOpsDesc = ops.sort(
        (op1, op2) => op2.txReceipt.blockNumber - op1.txReceipt.blockNumber
      )
      const latestTx = sortedOpsDesc[0]!.txReceipt
      latestBlockNumber = latestTx.blockNumber
      latestBlockHash = latestTx.blockHash
    }

    return { ops, latestBlockNumber, latestBlockHash }
  }

  async _updateUserOperations(
    newMetadata: UserMetadata,
    currentMetadata: UserMetadata,
    userId: number,
    exclude: Array<keyof UserMetadata> = []
  ) {
    const updateOps = []

    // Remove excluded keys from metadata object
    const metadata = { ...newMetadata }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    exclude.map((excludedKey) => delete metadata[excludedKey])
    // Compare the existing metadata with the new values and conditionally
    // perform update operations
    for (const key in metadata) {
      const typedKey = key as keyof UserMetadata
      if (
        Object.prototype.hasOwnProperty.call(metadata, key) &&
        Object.prototype.hasOwnProperty.call(currentMetadata, key) &&
        metadata[typedKey] !== currentMetadata[typedKey]
      ) {
        if (key === 'name') {
          updateOps.push(
            this.contracts.UserFactoryClient.updateName(userId, metadata.name)
          )
        }
        if (key === 'bio') {
          updateOps.push(
            this.contracts.UserFactoryClient.updateBio(userId, metadata.bio)
          )
        }
        if (key === 'location') {
          updateOps.push(
            this.contracts.UserFactoryClient.updateLocation(
              userId,
              metadata.location!
            )
          )
        }
        if (key === 'profile_picture_sizes') {
          updateOps.push(
            this.contracts.UserFactoryClient.updateProfilePhoto(
              userId,
              Utils.decodeMultihash(metadata.profile_picture_sizes!).digest
            )
          )
        }
        if (key === 'cover_photo_sizes') {
          updateOps.push(
            this.contracts.UserFactoryClient.updateCoverPhoto(
              userId,
              Utils.decodeMultihash(metadata.cover_photo_sizes!).digest
            )
          )
        }
      }
    }

    let ops
    let latestBlockNumber = -Infinity
    let latestBlockHash
    if (updateOps.length > 0) {
      // sort transactions by blocknumber and return most recent transaction
      ops = await Promise.all(updateOps)
      const sortedOpsDesc = ops.sort(
        (op1, op2) => op2.txReceipt.blockNumber - op1.txReceipt.blockNumber
      )
      const latestTx = sortedOpsDesc[0]!.txReceipt
      latestBlockNumber = latestTx.blockNumber
      latestBlockHash = latestTx.blockHash
    }

    return { ops, latestBlockNumber, latestBlockHash }
  }

  _validateUserMetadata(metadata: UserMetadata) {
    this.OBJECT_HAS_PROPS(metadata, USER_PROPS, USER_REQUIRED_PROPS)
  }

  /**
   * Metadata object may have extra fields.
   * - Add what user props might be missing to normalize
   * - Only keep core fields in USER_PROPS and 'user_id'.
   */
  cleanUserMetadata(metadata: UserMetadata) {
    USER_PROPS.forEach((prop) => {
      if (!(prop in metadata)) {
        // @ts-expect-error
        metadata[prop] = null
      }
    })
    return pick(metadata, USER_PROPS.concat('user_id'))
  }

  // Perform replica set update
  // Conditionally write to UserFactory contract, else write to UserReplicaSetManager
  // This behavior is to ensure backwards compatibility prior to contract deploy
  async _updateReplicaSetOnChain(userId: number, creatorNodeEndpoint: string) {
    // Attempt to update through UserReplicaSetManagerClient if present
    if (!this.contracts.UserReplicaSetManagerClient) {
      await this.contracts.initUserReplicaSetManagerClient()
    }

    const primaryEndpoint = CreatorNode.getPrimary(creatorNodeEndpoint)
    const secondaries = CreatorNode.getSecondaries(creatorNodeEndpoint)

    if (secondaries.length < 2) {
      throw new Error(
        `Invalid number of secondaries found - received ${secondaries}`
      )
    }

    const [primarySpID, secondary1SpID, secondary2SpID] = await Promise.all([
      this._retrieveSpIDFromEndpoint(primaryEndpoint!),
      this._retrieveSpIDFromEndpoint(secondaries[0]!),
      this._retrieveSpIDFromEndpoint(secondaries[1]!)
    ])

    // Update in new contract
    const txReceipt =
      await this.contracts.UserReplicaSetManagerClient?.updateReplicaSet(
        userId,
        primarySpID,
        [secondary1SpID, secondary2SpID]
      )
    const replicaSetSPIDs = [primarySpID, secondary1SpID, secondary2SpID]
    return {
      txReceipt,
      replicaSetSPIDs
    }
  }

  // Retrieve cached value for spID from endpoint if present, otherwise fetch from eth web3
  // Any error in the web3 fetch will short circuit the entire operation as expected
  async _retrieveSpIDFromEndpoint(endpoint: string) {
    const cachedSpID = getSpIDForEndpoint(endpoint)
    let spID = cachedSpID
    if (!spID) {
      const spEndpointInfo =
        await this.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromEndpoint(
          endpoint
        )
      // Throw if this spID is 0, indicating invalid
      spID = spEndpointInfo.spID
      if (spID === 0) {
        throw new Error(`Failed to find spID for ${endpoint}`)
      }
      // Cache value if it is valid
      setSpIDForEndpoint(endpoint, spID)
    }
    return spID
  }
}
