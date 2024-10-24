import { ProgressCB } from '../services/creatorNode'
import {
  Action,
  EntityManagerClient
} from '../services/dataContracts/EntityManagerClient'
import { Nullable, TrackMetadata, UploadTrackMetadata, Utils } from '../utils'

import type { BaseConstructorArgs } from './base'
import { Base, Services } from './base'

const TRACK_PROPS = [
  'owner_id',
  'title',
  'cover_art_sizes',
  'tags',
  'genre',
  'mood',
  'credits_splits',
  'release_date',
  'file_type',
  'is_stream_gated',
  'stream_conditions',
  'is_download_gated',
  'download_conditions',
  'is_original_available',
  'is_downloadable',
  'ai_attribution_user_id',
  'allowed_api_keys'
]
const TRACK_REQUIRED_PROPS = ['owner_id', 'title']

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
    metadata: UploadTrackMetadata,
    onProgress: () => void,
    trackId?: number
  ) {
    const updatedMetadata = await this.uploadTrackV2(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
    const {
      trackId: updatedTrackId,
      metadataCid,
      txReceipt
    } = await this.writeTrackToChain(updatedMetadata, Action.CREATE, trackId)
    return { trackId: updatedTrackId, metadataCid, updatedMetadata, txReceipt }
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
    coverArtFile: File | null,
    metadata: UploadTrackMetadata,
    onProgress: ProgressCB
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
   * Creates a trackId for each CID in metadataCids and adds each track to chain for this user.
   */
  async addTracksToChainV2(trackMetadatas: TrackMetadata[]) {
    const ownerId = this.userStateManager.getCurrentUserId()
    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }

    // Any failures in adding track to the blockchain will prevent further progress.
    // The list of successful track uploads is returned for revert operations by caller
    let requestFailed = false
    const trackIds = (
      await Promise.all(
        trackMetadatas.map(async (trackMetadata) => {
          try {
            const { trackId } = await this.writeTrackToChain(
              trackMetadata,
              Action.CREATE
            )
            return trackId
          } catch (e) {
            requestFailed = true
            console.error(`Failed to add track to chain: ${e}`)
            return null
          }
        })
      )
    ).filter(Boolean)

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

    if (!trackId) trackId = await this.generateTrackId()
    // Prevent extra fields from being added to metadata
    const parsedTrackMetadata = Track._parseTrackMetadata(trackMetadata)
    const metadataCid = await Utils.fileHasher.generateMetadataCidV1(
      parsedTrackMetadata
    )
    const { txReceipt } =
      await this.contracts.EntityManagerClient!.manageEntity(
        ownerId,
        EntityManagerClient.EntityType.TRACK,
        trackId,
        action,
        JSON.stringify({
          cid: metadataCid.toString(),
          data: parsedTrackMetadata
        })
      )
    return { trackId, metadataCid, txReceipt }
  }

  /**
   * Updates an existing track given metadata using only chain and not creator node.
   * @param metadata json of the track metadata with all fields, missing fields will error
   * @param transcodePreview bool: retranscode track preview and set preview_cid if true
   */
  async updateTrackV2(metadata: TrackMetadata, transcodePreview = false) {
    this.IS_OBJECT(metadata)

    const ownerId = this.userStateManager.getCurrentUserId()

    if (!ownerId) {
      throw new Error('No users loaded for this wallet')
    }
    metadata.owner_id = ownerId
    this._validateTrackMetadata(metadata)

    const trackId = metadata.track_id
    let updatedMetadata = { ...metadata }

    if (transcodePreview) {
      if (metadata.preview_start_seconds == null) {
        throw new Error('No track preview start time specified')
      }
      if (!metadata.audio_upload_id) {
        throw new Error('Missing required audio_upload_id')
      }

      // Transcode the new preview and receive back updated metadata
      updatedMetadata = await this.creatorNode.transcodeTrackPreview(metadata)
    }

    const { txReceipt } = await this.writeTrackToChain(
      updatedMetadata,
      Action.UPDATE,
      trackId
    )

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      trackId,
      updatedMetadata
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

  async generateTrackId(): Promise<number> {
    const encodedId = await this.discoveryProvider.getUnclaimedId('tracks')
    if (!encodedId) {
      throw new Error('No unclaimed track IDs')
    }
    return decodeHashId(encodedId)!
  }

  /* ------- PRIVATE  ------- */

  // Throws an error upon validation failure
  _validateTrackMetadata(metadata: Partial<TrackMetadata>) {
    this.OBJECT_HAS_PROPS(metadata, TRACK_PROPS, TRACK_REQUIRED_PROPS)
    this.creatorNode.validateTrackSchema(metadata)
  }

  /**
   * Prevents additional fields from being included in metadata
   */
  static _parseTrackMetadata(trackMetadata: TrackMetadata): TrackMetadata {
    const {
      blocknumber,
      is_delete,
      track_id,
      is_downloadable,
      is_original_available,
      created_at,
      isrc,
      iswc,
      credits_splits,
      description,
      genre,
      has_current_user_reposted,
      has_current_user_saved,
      license,
      mood,
      play_count,
      owner_id,
      release_date,
      repost_count,
      save_count,
      tags,
      title,
      track_segments,
      cover_art,
      cover_art_sizes,
      is_unlisted,
      is_scheduled_release,
      is_available,
      is_stream_gated,
      stream_conditions,
      is_download_gated,
      download_conditions,
      permalink,
      preview_start_seconds,
      duration,
      is_invalid,
      stem_of,
      ddex_app,
      is_playlist_upload,
      audio_upload_id,
      track_cid,
      orig_file_cid,
      orig_filename,
      preview_cid,
      dateListened,
      remix_of,
      ai_attribution_user_id,
      allowed_api_keys,
      bpm,
      is_custom_bpm,
      musical_key,
      is_custom_musical_key,
      audio_analysis_error_count,
      comments_disabled,
      comment_count,
      cover_attribution,
      field_visibility,
      ...other
    } = trackMetadata
    if (typeof other !== 'undefined') {
      console.warn('Unknown keys in upload metadata:', Object.keys(other))
    }
    return {
      blocknumber,
      is_delete,
      track_id,
      is_downloadable,
      is_original_available,
      created_at,
      isrc,
      iswc,
      credits_splits,
      description,
      genre,
      has_current_user_reposted,
      has_current_user_saved,
      license,
      mood,
      play_count,
      owner_id,
      release_date,
      repost_count,
      save_count,
      tags,
      title,
      track_segments,
      cover_art,
      cover_art_sizes,
      is_unlisted,
      is_scheduled_release,
      is_available,
      is_stream_gated,
      stream_conditions,
      is_download_gated,
      download_conditions,
      permalink,
      preview_start_seconds,
      duration,
      is_invalid,
      stem_of,
      ddex_app,
      is_playlist_upload,
      audio_upload_id,
      track_cid,
      orig_file_cid,
      orig_filename,
      preview_cid,
      dateListened,
      remix_of,
      ai_attribution_user_id,
      allowed_api_keys,
      bpm,
      is_custom_bpm,
      musical_key,
      is_custom_musical_key,
      audio_analysis_error_count,
      comments_disabled,
      comment_count,
      field_visibility,
      cover_attribution
    }
  }
}
