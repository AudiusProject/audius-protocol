import { pick } from 'lodash'
import { Base, BaseConstructorArgs, Services } from './base'
import { Nullable, UserMetadata, Utils } from '../utils'
import {
  CreatorNode,
  getSpIDForEndpoint,
  setSpIDForEndpoint
} from '../services/creatorNode'
import type { ServiceProvider } from './ServiceProvider'
import { EntityManagerClient } from '../services/dataContracts/EntityManagerClient'

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
  'artist_pick_track_id',
  'creator_node_endpoint',
  'associated_wallets',
  'associated_sol_wallets',
  'collectibles',
  'playlist_library',
  'events',
  'allow_ai_attribution'
] as Array<keyof UserMetadata>
// User metadata fields that are required on the metadata object and only can have
// non-null values
const USER_REQUIRED_PROPS = ['name', 'handle']
// Constants for user metadata fields

const { decodeHashId } = Utils

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
    this.createEntityManagerUser = this.createEntityManagerUser.bind(this)
    this.updateCreator = this.updateCreator.bind(this)
    this.updateIsVerified = this.updateIsVerified.bind(this)
    this.getUserListenCountsMonthly = this.getUserListenCountsMonthly.bind(this)
    this.getUserSubscribers = this.getUserSubscribers.bind(this)
    this.bulkGetUserSubscribers = this.bulkGetUserSubscribers.bind(this)

    this.updateMetadataV2 = this.updateMetadataV2.bind(this)
    this.uploadProfileImagesV2 = this.uploadProfileImagesV2.bind(this)
    this.createEntityManagerUserV2 = this.createEntityManagerUserV2.bind(this)
    this._waitForDiscoveryToIndexUser =
      this._waitForDiscoveryToIndexUser.bind(this)

    // For adding replica set to users on sign up
    this.assignReplicaSet = this.assignReplicaSet.bind(this)

    this.getClockValuesFromReplicaSet =
      this.getClockValuesFromReplicaSet.bind(this)
    this._waitForCreatorNodeEndpointIndexing =
      this._waitForCreatorNodeEndpointIndexing.bind(this)
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

  /**
   * Gets listen count data for a user's tracks grouped by month
   * @returns Dictionary of listen count data where keys are requested months
   */
  async getUserListenCountsMonthly(
    encodedUserId: string,
    startTime: string,
    endTime: string
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getUserListenCountsMonthly(
      encodedUserId,
      startTime,
      endTime
    )
  }

  /**
   * Gets the clock status for user in userStateManager across replica set.
   */
  async getClockValuesFromReplicaSet() {
    return await this.creatorNode.getClockValuesFromReplicaSet()
  }

  /**
   * Gets a user's subscribers.
   * @param params.encodedUserId string of the encoded user id
   * @returns Array of User metadata objects for each subscriber
   */
  async getUserSubscribers(encodedUserId: string) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    // 1 min timeout
    const timeoutMs = 60000
    return await this.discoveryProvider.getUserSubscribers(
      encodedUserId,
      timeoutMs
    )
  }

  /**
   * Bulk gets users' subscribers.
   * @param params.encodedUserIds JSON stringified array of
   *   encoded user ids
   * @returns Array of {user_id: <encoded user id>,
   *   subscriber_ids: Array[<encoded subscriber ids>]} objects
   */
  async bulkGetUserSubscribers(encodedUserIds: string) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    // 1 min timeout
    const timeoutMs = 60000
    return await this.discoveryProvider.bulkGetUserSubscribers(
      encodedUserIds,
      timeoutMs
    )
  }

  /* ------- SETTERS ------- */

  /**
   * Assigns a replica set to the user's metadata and adds new metadata to chain.
   * This creates a record for that user on the connected creator node.
   */
  async assignReplicaSet(
    { userId }: { userId: number },
    writeMetadataThroughChain = false
  ) {
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
        userId,
        writeMetadataThroughChain
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
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
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
    metadata: UserMetadata,
    writeMetadataThroughChain = false
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
        userId: metadata.user_id,
        writeMetadataThroughChain
      })
    }

    return metadata
  }

  async uploadProfileImagesV2(
    profilePictureFile: File,
    coverPhotoFile: File,
    metadata: UserMetadata
  ) {
    let didMetadataUpdate = false
    if (profilePictureFile) {
      const resp = await this.creatorNode.uploadProfilePictureV2(
        profilePictureFile
      )
      metadata.profile_picture_sizes = resp.id
      didMetadataUpdate = true
    }
    if (coverPhotoFile) {
      const resp = await this.creatorNode.uploadCoverPhotoV2(coverPhotoFile)
      metadata.cover_photo_sizes = resp.id
      didMetadataUpdate = true
    }

    if (didMetadataUpdate) {
      await this.updateMetadataV2({
        newMetadata: metadata,
        userId: metadata.user_id
      })
    }

    return metadata
  }

  async createEntityManagerUser(
    { metadata }: { metadata: UserMetadata },
    writeMetadataThroughChain = false
  ) {
    this.REQUIRES(Services.CREATOR_NODE)
    const phases = {
      CLEAN_AND_VALIDATE_METADATA: 'CLEAN_AND_VALIDATE_METADATA',
      AUTOSELECT_CONTENT_NODES: 'AUTOSELECT_CONTENT_NODES',
      SYNC_ACROSS_CONTENT_NODES: 'SYNC_ACROSS_CONTENT_NODES',
      SET_PRIMARY: 'SET_PRIMARY',
      UPLOAD_METADATA_AND_UPDATE_ON_CHAIN: 'UPLOAD_METADATA_AND_UPDATE_ON_CHAIN'
    }
    let phase = ''

    const logPrefix = `[User:assignReplicaSet()]`
    const fnStartMs = Date.now()
    let startMs = fnStartMs

    // The new metadata object that will contain the replica set
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
      const spIds = await Promise.all(
        [primary, ...secondaries].map(
          async (endpoint) => await this._retrieveSpIDFromEndpoint(endpoint)
        )
      )

      // Create the user with entityMananer
      const userId = await this._generateUserId()
      const manageEntityResponse =
        await this.contracts.EntityManagerClient!.manageEntity(
          userId,
          EntityManagerClient.EntityType.USER,
          userId,
          EntityManagerClient.Action.CREATE,
          spIds.join(',')
        )

      await this.waitForReplicaSetDiscoveryIndexing(
        userId,
        spIds,
        manageEntityResponse.txReceipt.blockNumber
      )

      // Upload metadata and call update user with the metadata
      const newMetadata = this.cleanUserMetadata({ ...metadata })
      this._validateUserMetadata(newMetadata)

      const newContentNodeEndpoints = CreatorNode.buildEndpoint(
        primary,
        secondaries
      )
      newMetadata.wallet = this.web3Manager.getWalletAddress()
      newMetadata.user_id = userId
      newMetadata.creator_node_endpoint = newContentNodeEndpoints
      this.userStateManager.setCurrentUser({
        ...newMetadata,
        // Initialize counts to be 0. We don't want to write this data to backends ever really
        // (hence the cleanUserMetadata above), but we do want to make sure clients
        // can properly "do math" on these numbers.
        followee_count: 0,
        follower_count: 0,
        repost_count: 0
      })

      // Update the new primary to the auto-selected primary
      phase = phases.SET_PRIMARY
      await this.creatorNode.setEndpoint(primary)

      // Update metadata in CN and on chain of newly assigned replica set
      phase = phases.UPLOAD_METADATA_AND_UPDATE_ON_CHAIN
      const { blockHash, blockNumber } = await this.updateAndUploadMetadata({
        newMetadata,
        userId,
        writeMetadataThroughChain
      })
      console.log(
        `${logPrefix} [phase: ${phase}] updateAndUploadMetadata() completed in ${
          Date.now() - startMs
        }ms`
      )

      console.log(`${logPrefix} completed in ${Date.now() - fnStartMs}ms`)
      return { newMetadata, blockHash, blockNumber }
    } catch (e) {
      const errorMsg = `assignReplicaSet() Error -- Phase ${phase} in ${
        Date.now() - fnStartMs
      }ms: ${e}`
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
      throw new Error(errorMsg)
    }
  }

  async createEntityManagerUserV2({ metadata }: { metadata: UserMetadata }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)

    try {
      // Create the user with EntityMananer
      const userId = await this._generateUserId()
      const manageEntityResponse =
        await this.contracts.EntityManagerClient!.manageEntity(
          userId,
          EntityManagerClient.EntityType.USER,
          userId,
          EntityManagerClient.Action.CREATE,
          'v2'
        )
      await this._waitForDiscoveryToIndexUser(
        userId,
        manageEntityResponse.txReceipt.blockNumber
      )

      // Ensure metadata has expected properties
      const newMetadata = this.cleanUserMetadata({ ...metadata })
      this._validateUserMetadata(newMetadata)

      newMetadata.is_storage_v2 = true
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

      // Update metadata on chain to include wallet
      const { blockHash, blockNumber } = await this.updateMetadataV2({
        newMetadata,
        userId
      })

      return { newMetadata, blockHash, blockNumber }
    } catch (e) {
      const errorMsg = `createEntityManagerUserV2() error: ${e}`
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
      throw new Error(errorMsg)
    }
  }

  async updateEntityManagerReplicaSet({
    userId,
    primary,
    secondaries,
    oldPrimary,
    oldSecondaries
  }: {
    userId: number
    primary: number
    secondaries: number[]
    oldPrimary: number
    oldSecondaries: number[]
  }) {
    const updateReplica = `${[oldPrimary, ...oldSecondaries].join(',')}:${[
      primary,
      ...secondaries
    ].join(',')}`

    const response = await this.contracts.EntityManagerClient!.manageEntity(
      userId,
      EntityManagerClient.EntityType.USER_REPLICA_SET,
      userId,
      EntityManagerClient.Action.UPDATE,
      updateReplica
    )
    return {
      blockHash: response.txReceipt.blockHash,
      blockNumber: response.txReceipt.blockNumber
    }
  }

  /**
   * Updates a creator (updates their data on the creator node).
   * DO NOT CALL FOR A STORAGEV2 USER (use updateMetadataV2 instead)
   */
  async updateCreator(
    userId: number,
    metadata: UserMetadata,
    writeMetadataThroughChain = false
  ) {
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
      CreatorNode.getPrimary(newMetadata.creator_node_endpoint)
    ) {
      throw new Error(
        `Not connected to correct content node. Expected ${CreatorNode.getPrimary(
          newMetadata.creator_node_endpoint
        )}, got ${this.creatorNode.getEndpoint()}`
      )
    }

    // Preserve old metadata object
    const oldMetadata = { ...user }

    // Update user creator_node_endpoint on chain if applicable
    const updateEndpointTxBlockNumber = null
    if (
      newMetadata.creator_node_endpoint !== oldMetadata.creator_node_endpoint
    ) {
      // Perform update to new contract
      startMs = Date.now()
      await this._updateReplicaSetOnChain(
        userId,
        newMetadata.creator_node_endpoint
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

    const entityManagerMetadata = writeMetadataThroughChain
      ? JSON.stringify({ cid: metadataMultihash, data: newMetadata })
      : metadataMultihash
    const response = await this.contracts.EntityManagerClient!.manageEntity(
      userId,
      EntityManagerClient.EntityType.USER,
      userId,
      EntityManagerClient.Action.UPDATE,
      entityManagerMetadata
    )
    const txReceipt = response.txReceipt
    const latestBlockNumber = txReceipt.blockNumber
    const latestBlockHash = txReceipt.blockHash

    // Write to CN to associate blockchain user id with updated metadata and block number
    await this.creatorNode.associateCreator(
      userId,
      metadataFileUUID,
      latestBlockNumber
    )

    // Update libs instance with new user metadata object
    this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })

    return {
      blockHash: latestBlockHash,
      blockNumber: latestBlockNumber,
      userId
    }
  }

  /**
   * Updates a user on whether they are verified on Audius
   */
  async updateIsVerified(userId: number, privateKey: string) {
    return await this.contracts.EntityManagerClient!.getManageEntityParams(
      userId,
      EntityManagerClient.EntityType.USER,
      userId,
      EntityManagerClient.Action.VERIFY,
      '',
      privateKey
    )
  }

  /**
   * Adds a user subscription for a given subscriber and user
   */
  async addUserSubscribe(userId: number) {
    try {
      const subscriberUserId = this.userStateManager.getCurrentUserId()
      const response = await this.contracts.EntityManagerClient!.manageEntity(
        subscriberUserId!,
        EntityManagerClient.EntityType.USER,
        userId,
        EntityManagerClient.Action.SUBSCRIBE,
        ''
      )
      return {
        blockHash: response.txReceipt.blockHash,
        blockNumber: response.txReceipt.blockNumber
      }
    } catch (e) {
      return {
        error: (e as Error).message
      }
    }
  }

  /**
   * Delete a user subscription for a given subscriber and user
   */
  async deleteUserSubscribe(userId: number) {
    try {
      const subscriberUserId = this.userStateManager.getCurrentUserId()
      const response = await this.contracts.EntityManagerClient!.manageEntity(
        subscriberUserId!,
        EntityManagerClient.EntityType.USER,
        userId,
        EntityManagerClient.Action.UNSUBSCRIBE,
        ''
      )
      return {
        blockHash: response.txReceipt.blockHash,
        blockNumber: response.txReceipt.blockNumber
      }
    } catch (e) {
      return {
        error: (e as Error).message
      }
    }
  }

  /* ------- PRIVATE  ------- */

  /**
   * 1. Uploads metadata to primary Content Node (which inherently calls a sync accross secondaries)
   * 2. Updates metadata on chain
   */
  async updateAndUploadMetadata({
    newMetadata,
    userId,
    writeMetadataThroughChain = false
  }: {
    newMetadata: UserMetadata
    userId: number
    writeMetadataThroughChain?: boolean
  }) {
    this.REQUIRES(Services.CREATOR_NODE, Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(newMetadata)
    const phases = {
      UPDATE_CONTENT_NODE_ENDPOINT_ON_CHAIN:
        'UPDATE_CONTENT_NODE_ENDPOINT_ON_CHAIN',
      UPLOAD_METADATA: 'UPLOAD_METADATA',
      UPDATE_METADATA_ON_CHAIN: 'UPDATE_METADATA_ON_CHAIN',
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
        const { txReceipt, replicaSetSPIDs } =
          await this._updateReplicaSetOnChain(
            userId,
            newMetadata.creator_node_endpoint
          )
        console.log(
          `${logPrefix} [phase: ${phase}] _updateReplicaSetOnChain() completed in ${
            Date.now() - startMs
          }ms`
        )
        startMs = Date.now()
        await this.waitForReplicaSetDiscoveryIndexing(
          userId,
          replicaSetSPIDs,
          txReceipt.blockNumber
        )
        // @ts-expect-error
        newMetadata.primary_id = replicaSetSPIDs[0]
        newMetadata.secondary_ids = replicaSetSPIDs.slice(1)
        console.log(
          `${logPrefix} [phase: ${phase}] waitForReplicaSetDiscoveryIndexing() completed in ${
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
      const entityManagerMetadata = writeMetadataThroughChain
        ? JSON.stringify({ cid: metadataMultihash, data: newMetadata })
        : metadataMultihash
      const response = await this.contracts.EntityManagerClient!.manageEntity(
        userId,
        EntityManagerClient.EntityType.USER,
        userId,
        EntityManagerClient.Action.UPDATE,
        entityManagerMetadata
      )
      const txReceipt = response.txReceipt
      const blockNumber = txReceipt.blockNumber

      startMs = Date.now()

      // Write to CN to associate blockchain user id with updated metadata and block number
      phase = phases.ASSOCIATE_USER
      await this.creatorNode.associateCreator(
        userId,
        metadataFileUUID,
        blockNumber
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
      return {
        blockHash: txReceipt.blockHash,
        blockNumber
      }
    } catch (e) {
      // TODO: think about handling the update metadata on chain and associating..
      const errorMsg = `updateAndUploadMetadata() Error -- Phase ${phase} in ${
        Date.now() - fnStartMs
      }ms: ${e}`
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
      throw new Error(errorMsg)
    }
  }

  /**
   * Storage V2 version of updateAndUploadMetadata. Only posts to chain and not Content Node.
   */
  async updateMetadataV2({
    newMetadata,
    userId
  }: {
    newMetadata: UserMetadata
    userId: number
  }) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    this.IS_OBJECT(newMetadata)

    const oldMetadata = this.userStateManager.getCurrentUser()
    if (!oldMetadata) {
      throw new Error('No current user.')
    }

    newMetadata = this.cleanUserMetadata(newMetadata)
    this._validateUserMetadata(newMetadata)

    try {
      // Write metadata to chain
      const cid = await Utils.fileHasher.generateMetadataCidV1(newMetadata)
      const { txReceipt } =
        await this.contracts.EntityManagerClient!.manageEntity(
          userId,
          EntityManagerClient.EntityType.USER,
          userId,
          EntityManagerClient.Action.UPDATE,
          JSON.stringify({
            cid: cid.toString(),
            data: newMetadata
          })
        )
      const blockNumber = txReceipt.blockNumber

      // Update libs instance with new user metadata object
      this.userStateManager.setCurrentUser({ ...oldMetadata, ...newMetadata })
      return {
        blockHash: txReceipt.blockHash,
        blockNumber
      }
    } catch (e) {
      const errorMsg = `updateMetadataV2() error: ${e}`
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
      throw new Error(errorMsg)
    }
  }

  /**
   * If a user's creator_node_endpoint is null, assign a replica set.
   * Used during the sanity check and in uploadImage() in files.js
   */
  async assignReplicaSetIfNecessary(writeMetadataThroughChain = false) {
    const user = this.userStateManager.getCurrentUser()

    // If no user is logged in, or a creator node endpoint is already assigned,
    // skip this call
    if (!user || user.creator_node_endpoint || user.is_storage_v2) return

    // Generate a replica set and assign to user
    try {
      await this.assignReplicaSet(
        { userId: user.user_id },
        writeMetadataThroughChain
      )
    } catch (e) {
      const errorMsg = `assignReplicaSetIfNecessary error - ${e}`
      if (e instanceof Error) {
        e.message = errorMsg
        throw e
      }
      throw new Error(errorMsg)
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

  /**
   * Waits for the input replica set to be indexed by the discovery node
   * If then replica set matches at the requested block number -> return null
   * If the replica set response is null at the block number -> throw error
   * If the replica set is mismatched at the block number -> throw error
   * If the timeout is exceeded before replica set indexed -> throw error
   */
  async waitForReplicaSetDiscoveryIndexing(
    userId: number,
    replicaSetSPIDs: number[],
    blockNumber: number,
    timeoutMs = 60000
  ): Promise<void> {
    const asyncFn = async () => {
      const encodedUserId = Utils.encodeHashId(userId)
      while (true) {
        let replicaSet
        try {
          // If the discovery node has not yet indexed the blocknumber,
          // this method will throw an error (which we catch and ignore)
          // If the user replica set does not exist, it will return an empty object
          // which should lead to the method throwing an error
          replicaSet = await this.discoveryProvider.getUserReplicaSet({
            encodedUserId: encodedUserId!,
            blockNumber
          })
        } catch (err) {
          // Do nothing on error
        }
        if (replicaSet) {
          if (
            replicaSet.primarySpID === replicaSetSPIDs[0] &&
            replicaSet.secondary1SpID === replicaSetSPIDs[1] &&
            replicaSet.secondary2SpID === replicaSetSPIDs[2]
          ) {
            break
          } else {
            throw new Error(
              `[User:waitForReplicaSetDiscoveryIndexing()] Indexed block ${blockNumber}, but did not find matching sp ids: ${JSON.stringify(
                replicaSet
              )}, ${replicaSetSPIDs}`
            )
          }
        }
        await Utils.wait(500)
      }
    }
    await Utils.racePromiseWithTimeout(
      asyncFn(),
      timeoutMs,
      `[User:waitForReplicaSetDiscoveryIndexing()] Timeout error after ${timeoutMs}ms`
    )
  }

  async _waitForDiscoveryToIndexUser(
    userId: number,
    blockNumber: number,
    timeoutMs = 60000
  ): Promise<void> {
    const asyncFn = async () => {
      while (true) {
        // Try to get user. Catch+ignore error if the block number isn't yet indexed
        let user
        try {
          user = (
            await this.discoveryProvider.getUsers(
              1, // limit
              0, // offset
              [userId], // userIds
              null, // walletAddress
              null, // handle
              blockNumber, // minBlockNumber
              true // includeIncomplete
            )
          )?.[0]
        } catch (err) {}

        // All done (success) if the user was indexed and ID matches
        if (user?.user_id === userId) {
          break
        }

        await Utils.wait(500)
      }
    }
    await Utils.racePromiseWithTimeout(
      asyncFn(),
      timeoutMs,
      `[User:_waitForDiscoveryToIndexUser()] Timeout error after ${timeoutMs}ms`
    )
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
  async _updateReplicaSetOnChain(userId: number, creatorNodeEndpoint: string) {
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
    const currentUser = this.userStateManager.getCurrentUser()
    if (!currentUser) throw new Error('Current user missing')

    // First try to update with URSM
    // Fallback to EntityManager when relay errors
    const currentPrimaryEndpoint = CreatorNode.getPrimary(
      currentUser.creator_node_endpoint
    )
    const currentSecondaries = CreatorNode.getSecondaries(
      currentUser.creator_node_endpoint
    )

    if (currentSecondaries.length < 2) {
      throw new Error(
        `Invalid number of secondaries found - received ${currentSecondaries}`
      )
    }

    const [oldPrimary, oldSecondary1SpID, oldSecondary2SpID] =
      await Promise.all([
        this._retrieveSpIDFromEndpoint(currentPrimaryEndpoint!),
        this._retrieveSpIDFromEndpoint(currentSecondaries[0]!),
        this._retrieveSpIDFromEndpoint(currentSecondaries[1]!)
      ])

    const txReceipt = await this.updateEntityManagerReplicaSet({
      userId,
      primary: primarySpID,
      secondaries: [secondary1SpID, secondary2SpID],
      oldPrimary: oldPrimary,
      oldSecondaries: [oldSecondary1SpID, oldSecondary2SpID]
    })
    const replicaSetSPIDs = [primarySpID, secondary1SpID, secondary2SpID]
    const updateEndpointTxBlockNumber = txReceipt?.blockNumber

    await this.waitForReplicaSetDiscoveryIndexing(
      userId,
      replicaSetSPIDs,
      updateEndpointTxBlockNumber
    )

    if (!txReceipt) {
      throw new Error('Unable to update replica set on chain')
    }
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

  async _generateUserId(): Promise<number> {
    const encodedId = await this.discoveryProvider.getUnclaimedId('users')
    if (!encodedId) {
      throw new Error('No unclaimed user IDs')
    }
    return decodeHashId(encodedId)!
  }
}
