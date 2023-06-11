import type { BaseConstructorArgs } from './base'

import { Base, Services } from './base'
import { Nullable, TrackMetadata, Utils } from '../utils'
import retry from 'async-retry'
import type { TransactionReceipt } from 'web3-core'
import {
  Action,
  EntityManagerClient
} from '../services/dataContracts/EntityManagerClient'

const TRACK_PROPS = [
  'owner_id',
  'title',
  'length',
  'cover_art_sizes',
  'tags',
  'genre',
  'mood',
  'key',
  'bpm',
  'credits_splits',
  'release_date',
  'file_type',
  'is_premium',
  'premium_conditions',
  'ai_attribution_user_id'
]
const TRACK_REQUIRED_PROPS = ['owner_id', 'title']

type ChainInfo = {
  metadataMultihash: string
  metadataFileUUID: string
  transcodedTrackUUID: string
  metadata?: TrackMetadata
}

const { decodeHashId } = Utils

export class Track extends Base {
  constructor(...args: BaseConstructorArgs) {
    super(...args)
    this.getTracks = this.getTracks.bind(this)
    this.getTracksIncludingUnlisted = this.getTracksIncludingUnlisted.bind(this)
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
    this.uploadTrack = this.uploadTrack.bind(this)
    this.uploadTrackContentToCreatorNode =
      this.uploadTrackContentToCreatorNode.bind(this)
    this.addTracksToChainAndCnode = this.addTracksToChainAndCnode.bind(this)
    this.updateTrack = this.updateTrack.bind(this)
    this.logTrackListen = this.logTrackListen.bind(this)
    this.deleteTrack = this.deleteTrack.bind(this)
  }
  /* ------- GETTERS ------- */

  /**
   * get tracks with all relevant track data
   * can be filtered by providing an integer array of ids
   * @param limit
   * @param offset
   * @param idsArray
   * @param targetUserId the owner of the tracks being queried
   * @param sort a string of form eg. blocknumber:asc,timestamp:desc describing a sort path
   * @param minBlockNumber The min block number
   * @param filterDeleted If set to true filters out deleted tracks
   * @returns Array of track metadata Objects
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
  async getTracks(
    limit = 100,
    offset = 0,
    idsArray: Nullable<string[]> = null,
    targetUserId: Nullable<string> = null,
    sort: Nullable<boolean> = null,
    minBlockNumber: Nullable<number> = null,
    filterDeleted: Nullable<boolean> = null,
    withUsers = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getTracks(
      limit,
      offset,
      idsArray,
      targetUserId,
      sort,
      minBlockNumber,
      filterDeleted,
      withUsers
    )
  }

  /**
   * get tracks with all relevant track data
   * can be filtered by providing an integer array of ids
   * @param limit
   * @param offset
   * @param idsArray
   * @param targetUserId the owner of the tracks being queried
   * @param sort a string of form eg. blocknumber:asc,timestamp:desc describing a sort path
   * @param minBlockNumber The min block number
   * @param filterDeleted If set to true filters out deleted tracks
   * @returns Array of track metadata Objects
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
  async getTracksVerbose(
    limit = 100,
    offset = 0,
    idsArray: Nullable<string[]> = null,
    targetUserId: Nullable<string> = null,
    sort: Nullable<boolean> = null,
    minBlockNumber: Nullable<number> = null,
    filterDeleted: Nullable<boolean> = null,
    withUsers = false
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getTracksVerbose(
      limit,
      offset,
      idsArray,
      targetUserId,
      sort,
      minBlockNumber,
      filterDeleted,
      withUsers
    )
  }

  /**
   * Gets tracks by their slug and owner handle
   * @param handle the owner's handle
   * @param slug the track's slug, including collision identifiers
   */
  async getTracksByHandleAndSlug(handle: string, slug: string) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getTracksByHandleAndSlug(handle, slug)
  }

  /**
   * gets all tracks matching identifiers, including unlisted.
   */
  async getTracksIncludingUnlisted(identifiers: string[], withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getTracksIncludingUnlisted(
      identifiers,
      withUsers
    )
  }

  /**
   * Gets random tracks from trending tracks for a given genre.
   * If genre not given, will return trending tracks across all genres.
   * Excludes specified track ids.
   */
  async getRandomTracks(
    genre: string,
    limit: number,
    exclusionList: number[],
    time: string
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getRandomTracks(
      genre,
      limit,
      exclusionList,
      time
    )
  }

  /**
   * Gets all stems for a given trackId as an array of tracks.
   */
  async getStemsForTrack(trackId: number) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getStemsForTrack(trackId)
  }

  /**
   * Gets all the remixes of a given trackId as an array of tracks.
   */
  async getRemixesOfTrack(
    trackId: number,
    limit: Nullable<number> = null,
    offset: Nullable<number> = null
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getRemixesOfTrack(
      trackId,
      limit,
      offset
    )
  }

  /**
   * Gets the remix parents of a given trackId as an array of tracks.
   */
  async getRemixTrackParents(
    trackId: number,
    limit: Nullable<number> = null,
    offset: Nullable<number> = null
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getRemixTrackParents(
      trackId,
      limit,
      offset
    )
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   */
  async getSavedTracks(limit = 100, offset = 0, withUsers = false) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getSavedTracks(limit, offset, withUsers)
  }

  /**
   * Gets tracks trending on Audius.
   */
  async getTrendingTracks(
    genre: Nullable<string> = null,
    time: Nullable<string> = null,
    idsArray: Nullable<number[]> = null,
    limit: Nullable<number> = null,
    offset: Nullable<number> = null
  ) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.discoveryProvider.getTrendingTracks(
      genre,
      time,
      idsArray,
      limit,
      offset
    )
  }

  /**
   * Gets listens for tracks bucketted by timeFrame.
   */
  async getTrackListens(
    timeFrame = null,
    idsArray = null,
    startTime = null,
    endTime = null,
    limit = null,
    offset = null
  ) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    return await this.identityService.getTrackListens(
      timeFrame,
      idsArray,
      startTime,
      endTime,
      limit,
      offset
    )
  }

  /**
   * get users that saved saveTrackId, sorted by follower count descending
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForTrack(100, 0, 1) - ID must be valid
   */
  async getSaversForTrack(limit = 100, offset = 0, saveTrackId: number) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getSaversForTrack(
      limit,
      offset,
      saveTrackId
    )
  }

  /**
   * get users that saved savePlaylistId, sorted by follower count descending
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForPlaylist(100, 0, 1) - ID must be valid
   */
  async getSaversForPlaylist(limit = 100, offset = 0, savePlaylistId: number) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getSaversForPlaylist(
      limit,
      offset,
      savePlaylistId
    )
  }

  /**
   * get users that reposted repostTrackId, sorted by follower count descending
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForTrack(100, 0, 1) - ID must be valid
   */
  async getRepostersForTrack(limit = 100, offset = 0, repostTrackId: number) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getRepostersForTrack(
      limit,
      offset,
      repostTrackId
    )
  }

  /**
   * get users that reposted repostPlaylistId, sorted by follower count descending
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForPlaylist(100, 0, 1) - ID must be valid
   */
  async getRepostersForPlaylist(
    limit = 100,
    offset = 0,
    repostPlaylistId: number
  ) {
    this.REQUIRES(Services.DISCOVERY_PROVIDER)
    return await this.discoveryProvider.getRepostersForPlaylist(
      limit,
      offset,
      repostPlaylistId
    )
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   */
  async getListenHistoryTracks(limit = 100, offset = 0) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const userId = this.userStateManager.getCurrentUserId()
    return await this.identityService.getListenHistoryTracks(
      userId!,
      limit,
      offset
    )
  }

  /* ------- SETTERS ------- */

  /**
   * Takes in a readable stream if isServer is true, or a file reference if isServer is
   * false.
   * Uploads file, retrieves multihash, adds multihash to input metadata object,
   * uploads metadata, and finally returns metadata multihash
   * Wraps the stateless function in AudiusLib.
   *
   * @param trackFile ReadableStream from server, or File handle on client
   * @param coverArtFile ReadableStream from server, or File handle on client
   * @param metadata json of the track metadata with all fields, missing fields will error
   * @param onProgress callback fired with (loaded, total) on byte upload progress
   */
  async uploadTrackV2AndWriteToChain(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: () => void
  ) {
    const updatedMetadata = await this.uploadTrackV2(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
    const { trackId, metadataCid, txReceipt } = await this.writeTrackToChain(
      updatedMetadata,
      Action.CREATE
    )
    return { trackId, metadataCid, updatedMetadata, txReceipt }
  }

  /**
   * Only uploads track but does not write to chain. Do not call by itself.
   *
   * @dev To upload a single track, call uploadTrackV2AndWriteToChain() instead.
   * @dev To upload multiple uploads, call this function multiple times and then call addTracksToChainV2() once.
   *
   * @param trackFile ReadableStream from server, or File handle on client
   * @param coverArtFile ReadableStream from server, or File handle on client
   * @param metadata json of the track metadata with all fields, missing fields will error
   * @param onProgress callback fired with (loaded, total) on byte upload progress
   */
  async uploadTrackV2(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: () => void
  ) {
    // Validate inputs
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

    // Upload track audio and cover art to storage node
    const updatedMetadata =
      await this.creatorNode.uploadTrackAudioAndCoverArtV2(
        trackFile,
        coverArtFile,
        metadata,
        onProgress
      )
    return updatedMetadata
  }

  /**
   * Takes in a readable stream if isServer is true, or a file reference if isServer is
   * false.
   * Uploads file, retrieves multihash, adds multihash to input metadata object,
   * uploads metadata, and finally returns metadata multihash
   * Wraps the stateless function in AudiusLib.
   *
   * @param trackFile ReadableStream from server, or File handle on client
   * @param coverArtFile ReadableStream from server, or File handle on client
   * @param metadata json of the track metadata with all fields, missing fields will error
   * @param onProgress callback fired with (loaded, total) on byte upload progress
   */
  async uploadTrack(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: () => void
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
        transcodedTrackUUID,
        transcodedTrackCID
      } = await retry(
        async () => {
          return await this.creatorNode.uploadTrackContent(
            trackFile,
            coverArtFile,
            metadata,
            onProgress
          )
        },
        {
          // Retry function 3x
          // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
          minTimeout: 500,
          maxTimeout: 4000,
          factor: 3,
          retries: 3,
          onRetry: (err) => {
            if (err) {
              console.log('uploadTrackContent retry error: ', err)
            }
          }
        }
      )
      phase = phases.ADDING_TRACK

      // Write metadata to chain
      const trackId = await this._generateTrackId()
      const entityManagerMetadata = JSON.stringify({
          cid: metadataMultihash,
          data: metadata
        })
      const response = await this.contracts.EntityManagerClient!.manageEntity(
        ownerId,
        EntityManagerClient.EntityType.TRACK,
        trackId,
        EntityManagerClient.Action.CREATE,
        entityManagerMetadata
      )
      const txReceipt = response.txReceipt

      phase = phases.ASSOCIATING_TRACK
      // Associate the track id with the file metadata and block number
      await this.creatorNode.associateTrack(
        trackId,
        metadataFileUUID,
        txReceipt.blockNumber,
        transcodedTrackUUID
      )
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber,
        trackId,
        transcodedTrackCID,
        error: false
      }
    } catch (e) {
      return {
        error: (e as Error).message,
        phase
      }
    }
  }

  /**
   * Creates a trackId for each CID in metadataCids and adds each track to chain for this user.
   */
  async addTracksToChainV2(trackMetadatas: TrackMetadata[]) {
    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    let trackIds: number[] = []
    let requestFailed = false
    await Promise.all(
      trackMetadatas.map(async (trackMetadata) => {
        try {
          const { trackId } = await this.writeTrackToChain(
            trackMetadata,
            Action.CREATE
          )
          trackIds.push(trackId)
        } catch (e) {
          requestFailed = true
          console.error(`Failed to add track to chain: ${e}`)
        }
      })
    )

    // Any failures in addding track to the blockchain will prevent further progress.
    // The list of successful track uploads is returned for revert operations by caller
    trackIds = trackIds.filter(Boolean)
    const error = requestFailed || trackIds.length !== trackMetadatas.length
    return { error, trackIds }
  }

  /**
   * Adds the given track's metadata to chain for this user, optionally creating a trackId if one doesn't exist.
   */
  async writeTrackToChain(
    trackMetadata: TrackMetadata,
    action: Action,
    trackId?: number
  ) {
    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    if (!trackId) trackId = await this._generateTrackId()
    const metadataCid = await Utils.fileHasher.generateMetadataCidV1(
      trackMetadata
    )
    const { txReceipt } =
      await this.contracts.EntityManagerClient!.manageEntity(
        ownerId,
        EntityManagerClient.EntityType.TRACK,
        trackId,
        action,
        JSON.stringify({ cid: metadataCid.toString(), data: trackMetadata })
      )
    return { trackId, metadataCid, txReceipt }
  }

  /**
   * Takes in a readable stream if isServer is true, or a file reference if isServer is
   * false.
   * WARNING: Uploads file to creator node, but does not call contracts
   * Please pair this with the addTracksToChainAndCnode
   */
  async uploadTrackContentToCreatorNode(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: () => void
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
    const {
      metadataMultihash,
      metadataFileUUID,
      transcodedTrackCID,
      transcodedTrackUUID,
      metadata: respMetadata
    } = await retry(
      async () => {
        return await this.creatorNode.uploadTrackContent(
          trackFile,
          coverArtFile,
          metadata,
          onProgress
        )
      },
      {
        // Retry function 3x
        // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
        minTimeout: 500,
        maxTimeout: 4000,
        factor: 3,
        retries: 3,
        onRetry: (err) => {
          if (err) {
            console.log('uploadTrackContentToCreatorNode retry error: ', err)
          }
        }
      }
    )
    return {
      metadataMultihash,
      metadataFileUUID,
      transcodedTrackCID,
      transcodedTrackUUID,
      metadata: respMetadata
    }
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds tracks to chain for this user
   * Associates tracks with user on creatorNode
   */
  async addTracksToChainAndCnode(
    trackMultihashAndUUIDList: ChainInfo[]
  ) {
    this.REQUIRES(Services.CREATOR_NODE)
    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    const addedToChain: Array<
      Omit<ChainInfo, 'metadataMultihash' | 'metadata'> & {
        trackId: number
        txReceipt: TransactionReceipt
      }
    > = []
    let requestFailed = false
    await Promise.all(
      trackMultihashAndUUIDList.map(async (trackInfo, i) => {
        try {
          const {
            metadataMultihash,
            metadataFileUUID,
            transcodedTrackUUID,
            metadata
          } = trackInfo

          const entityManagerMetadata = JSON.stringify({
            cid: metadataMultihash,
            data: metadata
          })

          // Write metadata to chain
          const trackId = await this._generateTrackId()
          const response =
            await this.contracts.EntityManagerClient!.manageEntity(
              ownerId,
              EntityManagerClient.EntityType.TRACK,
              trackId,
              EntityManagerClient.Action.CREATE,
              entityManagerMetadata
            )
          const txReceipt = response.txReceipt
          addedToChain[i] = {
            trackId,
            metadataFileUUID,
            transcodedTrackUUID,
            txReceipt
          }
        } catch (e) {
          requestFailed = true
          console.error(e)
        }
      })
    )

    // Any failures in addTrack to the blockchain will prevent further progress
    // The list of successful track uploads is returned for revert operations by caller
    if (
      requestFailed ||
      addedToChain.filter(Boolean).length !== trackMultihashAndUUIDList.length
    ) {
      return {
        error: true,
        trackIds: addedToChain.filter(Boolean).map((x) => x.trackId)
      }
    }

    const associatedWithCreatorNode = []
    try {
      await Promise.all(
        addedToChain.map(async (chainTrackInfo) => {
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
      return { error: true, trackIds: addedToChain.map((x) => x.trackId) }
    }

    return { error: false, trackIds: addedToChain.map((x) => x.trackId) }
  }

  /**
   * Updates an existing track given metadata. This function expects that all associated files
   * such as track content, cover art are already on creator node.
   * @param metadata json of the track metadata with all fields, missing fields will error
   */
  async updateTrack(metadata: TrackMetadata) {
    this.REQUIRES(Services.CREATOR_NODE)
    this.IS_OBJECT(metadata)

    const ownerId = this.userStateManager.getCurrentUserId()

    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }
    metadata.owner_id = ownerId
    this._validateTrackMetadata(metadata)

    // Upload new metadata
    const { metadataMultihash, metadataFileUUID } =
      await this.creatorNode.uploadTrackMetadata(metadata)
    // Write the new metadata to chain
    const trackId: number = metadata.track_id
    const entityManagerMetadata = JSON.stringify({
      cid: metadataMultihash,
      data: metadata
    })
    const response = await this.contracts.EntityManagerClient!.manageEntity(
      ownerId,
      EntityManagerClient.EntityType.TRACK,
      trackId,
      EntityManagerClient.Action.UPDATE,
      entityManagerMetadata
    )
    const txReceipt = response.txReceipt
    // Re-associate the track id with the new metadata
    await this.creatorNode.associateTrack(
      trackId,
      metadataFileUUID,
      txReceipt.blockNumber
    )
    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      trackId
    }
  }

  /**
   * Updates an existing track given metadata using only chain and not creator node.
   * @param metadata json of the track metadata with all fields, missing fields will error
   */
  async updateTrackV2(metadata: TrackMetadata) {
    this.IS_OBJECT(metadata)

    const ownerId = this.userStateManager.getCurrentUserId()

    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }
    metadata.owner_id = ownerId
    this._validateTrackMetadata(metadata)

    const trackId = metadata.track_id
    const { txReceipt } = await this.writeTrackToChain(
      metadata,
      Action.UPDATE,
      trackId
    )

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      trackId
    }
  }

  /**
   * Logs a track listen for a given user id.
   * @param unauthUuid account for those not logged in
   * @param trackId listened to
   */
  async logTrackListen(
    trackId: number,
    unauthUuid: number,
    solanaListen = false
  ) {
    this.REQUIRES(Services.IDENTITY_SERVICE)
    const accountId = this.userStateManager.getCurrentUserId()

    const userId = accountId ?? unauthUuid
    return await this.identityService.logTrackListen(
      trackId,
      userId,
      null,
      null,
      solanaListen
    )
  }

  /**
   * Marks a tracks as deleted
   * @param trackId
   */
  async deleteTrack(trackId: number) {
    const ownerId = this.userStateManager.getCurrentUserId()

    if (!ownerId) throw new Error('No users loaded for this wallet')

    return await this.contracts.EntityManagerClient!.manageEntity(
      ownerId,
      EntityManagerClient.EntityType.TRACK,
      trackId,
      EntityManagerClient.Action.DELETE,
      ''
    )
  }

  /* ------- PRIVATE  ------- */

  // Throws an error upon validation failure
  _validateTrackMetadata(metadata: TrackMetadata) {
    this.OBJECT_HAS_PROPS(metadata, TRACK_PROPS, TRACK_REQUIRED_PROPS)
    this.creatorNode.validateTrackSchema(metadata)
  }

  async _generateTrackId(): Promise<number> {
    const encodedId = await this.discoveryProvider.getUnclaimedId('tracks')
    if (!encodedId) {
      throw new Error('No unclaimed track IDs')
    }
    return decodeHashId(encodedId)!
  }
}
