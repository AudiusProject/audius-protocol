import { Base, Services } from './base'
import type { PlaylistMetadata } from '../services/creatorNode'
import type { Nullable } from '../utils'

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
   * String error message returned
   */
  error: Nullable<string>
}
type PlaylistTrack = { time: number; metadata_time?: number; track: number }

type PlaylistParam = {
  playlist_id: number
  playlist_name: string
  artwork?: { file?: File; url?: string }
  playlist_contents: { track_ids: PlaylistTrack[] | number[] }
  cover_art_sizes: string
  description: string
  is_private: boolean
  is_album: boolean
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

  mapTimestamps(addedTimestamps: PlaylistTrack[]) {
    const trackIds = addedTimestamps.map(
      (trackObj) => ({
        track: trackObj.track,
        time: trackObj.metadata_time ?? trackObj.time // default to time for legacy playlists
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
      error: null
    }
  }

  /**
   * Create a playlist using updated data contracts flow
   */
  async createPlaylist(
    playlist: PlaylistParam
  ): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()
    try {
      const userId: number | null = this.userStateManager.getCurrentUserId()
      if (!userId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const createAction = Action.CREATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      let dirCID
      if (playlist?.artwork?.file) {
        const updatedPlaylistImage = await this.creatorNode.uploadImage(
          playlist.artwork.file,
          true // square
        )
        dirCID = updatedPlaylistImage.dirCID
      }

      const web3 = this.web3Manager.getWeb3()
      const currentBlockNumber = await web3.eth.getBlockNumber()
      const currentBlock = await web3.eth.getBlock(currentBlockNumber)
      const tracks = playlist.playlist_contents.track_ids.map((trackId) => ({
        track: trackId as number,
        time: currentBlock.timestamp as number
      }))

      const metadata: PlaylistMetadata = {
        playlist_id: playlist.playlist_id,
        playlist_contents: { track_ids: tracks },
        playlist_name: playlist.playlist_name,
        playlist_image_sizes_multihash: dirCID ?? playlist.cover_art_sizes, // default to cover_art_sizes for new playlists from tracks
        description: playlist.description,
        is_album: playlist.is_album,
        is_private: playlist.is_private
      }

      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const manageEntityResponse = await this.manageEntity({
        userId: userId,
        entityType,
        entityId: playlist.playlist_id,
        action: createAction,
        metadataMultihash
      })
      const txReceipt = manageEntityResponse.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
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
  async deletePlaylist(playlistId: number): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()
    const userId: number | null = this.userStateManager.getCurrentUserId()
    if (!userId) {
      responseValues.error = 'Missing current user ID'
      return responseValues
    }
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
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  /**
   * Update a playlist using updated data contracts flow
   */
  async updatePlaylist(
    playlist: PlaylistParam
  ): Promise<PlaylistOperationResponse> {
    const responseValues: PlaylistOperationResponse =
      this.getDefaultPlaylistReponseValues()

    try {
      const userId: number | null = this.userStateManager.getCurrentUserId()

      if (!playlist || playlist === undefined) {
        responseValues.error = 'Missing current playlist'
        return responseValues
      }
      if (!userId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const updateAction = Action.UPDATE
      const entityType = EntityType.PLAYLIST
      this.REQUIRES(Services.CREATOR_NODE)
      let dirCID
      if (playlist?.artwork?.file) {
        const updatedPlaylistImage = await this.creatorNode.uploadImage(
          playlist.artwork.file,
          true // square
        )
        dirCID = updatedPlaylistImage.dirCID
      }

      const trackIds = this.mapTimestamps(playlist.playlist_contents.track_ids as PlaylistTrack[])

      const metadata: PlaylistMetadata = {
        playlist_id: playlist.playlist_id,
        playlist_contents: { track_ids: trackIds },
        playlist_name: playlist.playlist_name,
        playlist_image_sizes_multihash: dirCID ?? playlist.cover_art_sizes,
        description: playlist.description,
        is_album: playlist.is_album,
        is_private: playlist.is_private
      }
      const { metadataMultihash } =
        await this.creatorNode.uploadPlaylistMetadata(metadata)
      const resp = await this.manageEntity({
        userId,
        entityType,
        entityId: playlist.playlist_id,
        action: updateAction,
        metadataMultihash
      })
      const txReceipt = resp.txReceipt
      responseValues.blockHash = txReceipt.blockHash
      responseValues.blockNumber = txReceipt.blockNumber
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
      return { txReceipt: null, error }
    }
  }
}
