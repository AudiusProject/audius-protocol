import { Base, Services } from './base'
import type { PlaylistMetadata } from '../services/creatorNode'
import { Nullable, Utils } from '../utils'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete'
}

export enum EntityType {
  PLAYLIST = 'Playlist'
}

export interface PlaylistOperationResponse {
  /**
   * Blockhash of playlist transaction
   */
  blockHash: Nullable<string>
  /**
   * Block number of playlist transaction
   */
  blockNumber: Nullable<number>
  /**
   * ID of playlist being modified
   */
  playlistId: Nullable<number>
  /**
   * String error message returned
   */
  error: Nullable<string>
}

const { encodeHashId, decodeHashId } = Utils

// Minimum playlist ID, intentionally higher than legacy playlist ID range
const MIN_PLAYLIST_ID = 400000
// Maximum playlist ID, reflects postgres max integer value
const MAX_PLAYLIST_ID = 2147483647

type PlaylistTrackId = { time: number; track: number; metadata_time?: number }

type PlaylistContents = {
  track_ids: PlaylistTrackId[]
}

/*
  API surface for updated data contract interactions.
  Provides simplified entity management in a generic fashion
  Handles metadata + file upload etc. for entities such as Playlist/Track/User
*/
export class EntityManager extends Base {
  /**
   * Generate random integer between two known values
   */
  getRandomInt(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
  }

  async getFullPlaylist(playlistId: number, userId: number) {
    const encodedPlaylistId = encodeHashId(playlistId) as string
    const encodedUserId = encodeHashId(userId) as string

    const playlist: any = (
      await this.discoveryProvider.getFullPlaylist(
        encodedPlaylistId,
        encodedUserId
      )
    )[0]
    return playlist
  }

  mapAddedTimestamps(added_timestamps: any) {
    const trackIds = added_timestamps.map(
      (trackObj: {
        track_id: string
        metadata_timestamp?: number
        timestamp: number
      }) => ({
        track: decodeHashId(trackObj.track_id),
        time: trackObj.metadata_timestamp ?? trackObj.timestamp
      })
    )

    return trackIds
  }

  /**
   * Playlist default response values
   */
  getDefaultPlaylistReponseValues(): PlaylistOperationResponse {
    return {
      blockHash: null,
      blockNumber: null,
      playlistId: null,
      error: null
    }
  }

  /**
   * Create a playlist using updated data contracts flow
   */
  async createPlaylist({
    playlistId,
    playlistName,
    trackIds,
    description,
    isAlbum,
    isPrivate,
    coverArt,
    logger = console
  }: {
    playlistId: number
    playlistName: string
    trackIds: number[]
    description: string
    isAlbum: boolean
    isPrivate: boolean
    coverArt: string
    logger: Console
  }): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()
    try {

      const currentUserId: string | null =
        this.userStateManager.getCurrentUserId()
      if (!currentUserId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const userId: number = parseInt(currentUserId)
      const createAction = Action.CREATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      const updatedPlaylistImage = await this.creatorNode.uploadImage(
        coverArt,
        true // square
      )
      const web3 = this.web3Manager.getWeb3()
      const currentBlockNumber = await web3.eth.getBlockNumber()
      const currentBlock = await web3.eth.getBlock(currentBlockNumber)
      const tracks = trackIds.map((trackId) => ({
        track: trackId,
        time: currentBlock.timestamp as number
      }))
      const dirCID = updatedPlaylistImage.dirCID
      const metadata: PlaylistMetadata = {
        playlist_id: playlistId,
        playlist_contents: { track_ids: tracks },
        playlist_name: playlistName,
        playlist_image_sizes_multihash: dirCID,
        description,
        is_album: isAlbum,
        is_private: isPrivate
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const manageEntityResponse = await this.manageEntity({
        userId: userId,
        entityType,
        entityId: playlistId,
        action: createAction,
        metadataMultihash
      })
      const txReceipt = manageEntityResponse.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  /**
   * Delete a playlist using updated data contracts flow
   */
  async deletePlaylist({
    playlistId,
    logger = console
  }: {
    playlistId: number
    logger: any
  }): Promise<{ blockHash: any; blockNumber: any }> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()
    const currentUserId: string | null =
      this.userStateManager.getCurrentUserId()
    if (!currentUserId) {
      responseValues.error = 'Missing current user ID'
      return responseValues
    }
    const userId: number = parseInt(currentUserId)
    try {
      const resp = await this.manageEntity({
        userId,
        entityType: EntityType.PLAYLIST,
        entityId: playlistId,
        action: Action.DELETE,
        metadataMultihash: ''
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  /**
   * Update a playlist using updated data contracts flow
   **/
  async editPlaylist({
    playlistId,
    playlistName,
    description,
    isAlbum,
    isPrivate,
    coverArt,
    logger = console
  }: {
    playlistId: number
    playlistName: Nullable<string>
    description: Nullable<string>
    isAlbum: Nullable<boolean>
    isPrivate: Nullable<boolean>
    coverArt: Nullable<string>
    logger: Console
  }): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()

    try {
      const currentUserId: string | null =
        this.userStateManager.getCurrentUserId()
      if (!playlistId || playlistId === undefined) {
        responseValues.error = 'Missing current playlistId'
        return responseValues
      }
      if (!currentUserId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const userId: number = parseInt(currentUserId)
      const updateAction = Action.UPDATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      let dirCID
      if (coverArt) {
        // @ts-expect-error
        const updatedPlaylistImage = await this.creatorNode.uploadImage(
          coverArt,
          true // square
        )
        dirCID = updatedPlaylistImage.dirCID
      }
      const playlist = await this.getFullPlaylist(playlistId, userId)
      const existingPlaylistTracks = this.mapAddedTimestamps(
        playlist.added_timestamps
      )
      const metadata: PlaylistMetadata = {
        playlist_id: playlistId,
        playlist_contents: { track_ids: existingPlaylistTracks },
        playlist_name: playlistName ?? playlist.playlist_name,
        playlist_image_sizes_multihash: dirCID ?? playlist.cover_art,
        description: description ?? playlist.description,
        is_album: isAlbum ?? playlist.is_album,
        is_private: isPrivate ?? playlist.is_private
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlistId,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  async addPlaylistTrack({
    playlistId,
    trackId,
    timestamp,
    logger = console
  }: {
    playlistId: number
    trackId: number
    timestamp: number
    logger: Console
  }): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()

    try {
      const currentUserId: string | null =
        this.userStateManager.getCurrentUserId()
      if (!playlistId || playlistId === undefined) {
        responseValues.error = 'Missing current playlistId'
        return responseValues
      }
      if (!currentUserId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const userId: number = parseInt(currentUserId)
      const updateAction = Action.UPDATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)

      const playlist = await this.getFullPlaylist(playlistId, userId)
      console.log('asdf existing playlist', playlist)

      const updatedPlaylistTracks = this.mapAddedTimestamps(
        playlist.added_timestamps
      )

      updatedPlaylistTracks.push({
        track: trackId,
        time: timestamp
      })

      const metadata: PlaylistMetadata = {
        playlist_id: playlistId,
        playlist_contents: { track_ids: updatedPlaylistTracks },
        playlist_name: playlist.playlist_name,
        playlist_image_sizes_multihash: playlist.cover_art,
        description: playlist.description,
        is_album: playlist.is_album,
        is_private: playlist.is_private
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlistId,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  async deletePlaylistTrack({
    playlistId,
    trackId,
    timestamp,
    logger = console
  }: {
    playlistId: number
    trackId: number
    timestamp: number
    logger: Console
  }): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()

    try {
      const currentUserId: string | null =
        this.userStateManager.getCurrentUserId()
      if (!playlistId || playlistId === undefined) {
        responseValues.error = 'Missing current playlistId'
        return responseValues
      }
      if (!currentUserId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const userId: number = parseInt(currentUserId)
      const updateAction = Action.UPDATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      const playlist = await this.getFullPlaylist(playlistId, userId)
      console.log('asdf existing playlist', playlist)

      const existingPlaylistTracks = this.mapAddedTimestamps(
        playlist.added_timestamps
      )

      const updatedTrackIds = existingPlaylistTracks.filter(
        (trackObj: { track: number; metadata_time?: number; time: number }) =>
          (trackObj.track !== trackId &&
            timestamp !== trackObj.metadata_time) ??
          trackObj.time
      )

      const metadata: PlaylistMetadata = {
        playlist_id: playlistId,
        playlist_contents: { track_ids: updatedTrackIds },
        playlist_name: playlist.playlist_name,
        playlist_image_sizes_multihash: playlist.cover_art,
        description: playlist.description,
        is_album: playlist.is_album,
        is_private: playlist.is_private
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlistId,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  /**
   * Update a playlist using updated data contracts flow
   **/
  async orderPlaylist({
    playlistId,
    trackIds,
    logger = console
  }: {
    playlistId: number
    trackIds: number[]
    logger: Console
  }): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()

    try {
      const currentUserId: string | null =
        this.userStateManager.getCurrentUserId()
      if (!playlistId || playlistId === undefined) {
        responseValues.error = 'Missing current playlistId'
        return responseValues
      }
      if (!currentUserId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const userId: number = parseInt(currentUserId)
      const updateAction = Action.UPDATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      console.log('asdf get full playlist ', { playlistId, userId })
      const playlist = await this.getFullPlaylist(playlistId, userId)
      console.log('asdf existing playlist', playlist)

      const existingPlaylistTracks = this.mapAddedTimestamps(
        playlist.added_timestamps
      )

      let trackIdsWithTimes = []
      const trackIdTimes = {}
      existingPlaylistTracks.forEach(
        (trackObj: { track: number; metadata_time?: number; time: number }) => {
          const trackId = trackObj.track
          const timestamp = trackObj.metadata_time ?? trackObj.time
          if (trackId in trackIdTimes) {
            trackIdTimes[trackId].push(timestamp)
          } else {
            trackIdTimes[trackId] = [timestamp]
          }
        }
      )

      // new tracks default to currentBlock timestamp
      trackIdsWithTimes = trackIds.map((trackId: number) => ({
        track: trackId,
        time: trackIdTimes[trackId].pop()
      }))
      const metadata: PlaylistMetadata = {
        playlist_id: playlistId,
        playlist_contents: { track_ids: trackIdsWithTimes },
        playlist_name: playlist.playlist_name,
        playlist_image_sizes_multihash: playlist.cover_art,
        description: playlist.description,
        is_album: playlist.is_album,
        is_private: playlist.is_private
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)

      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlistId,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
      responseValues.playlistId = playlistId
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  /**
   * Manage an entity with the updated data contract flow
   * Leveraged to manipulate User/Track/Playlist/+ other entities
   */
  async manageEntity({
    userId,
    entityType,
    entityId,
    action,
    metadataMultihash
  }: {
    userId: number
    entityType: EntityType
    entityId: number
    action: Action
    metadataMultihash: string
  }): Promise<
    { txReceipt: any; error: null } | { txReceipt: null; error: string }
  > {
    let error = null
    let resp: any
    try {
      console.log('asdf managing entity', {
        userId,
        entityType,
        entityId,
        action,
        metadataMultihash
      })

      resp = await this.contracts.EntityManagerClient?.manageEntity(
        userId,
        entityType,
        entityId,
        action,
        metadataMultihash
      )

      return { txReceipt: resp.txReceipt, error }
    } catch (e) {
      error = (e as Error).message
      console.log('asdf manageEntity error', error)
      return { txReceipt: null, error }
    }
  }
}
