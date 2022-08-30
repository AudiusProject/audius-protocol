import { Base, Services } from './base'
import type { PlaylistMetadata } from '../services/creatorNode'
import type { Nullable, Utils } from '../utils'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow'
}

export enum EntityType {
  PLAYLIST = 'Playlist',
  USER = 'User'
}

export interface EntityManagerOperationResponse {
  /**
   * Blockhash of entityManager transaction
   */
  blockHash: Nullable<string>
  /**
   * Block number of entityManager transaction
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
  playlist_contents: { track_ids: PlaylistTrack[] } // number[] for playlist upload flow
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
  getRandomInt = Utils.getRandomInt

  mapTimestamps(addedTimestamps: PlaylistTrack[]) {
    const trackIds = addedTimestamps.map((trackObj) => ({
      track: trackObj.track,
      time: trackObj.metadata_time ?? trackObj.time // default to time for legacy playlists
    }))

    return trackIds
  }

  /**
   * Playlist default response values
   */
  getDefaultEntityManagerResponseValues(): EntityManagerOperationResponse {
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
  ): Promise<EntityManagerOperationResponse> {
    const responseValues: EntityManagerOperationResponse =
      this.getDefaultEntityManagerResponseValues()
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
      const tracks = this.mapTimestamps(playlist.playlist_contents.track_ids)

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
  async deletePlaylist(
    playlistId: number
  ): Promise<EntityManagerOperationResponse> {
    const responseValues: EntityManagerOperationResponse =
      this.getDefaultEntityManagerResponseValues()
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

  /*
   * Create or delete a follow operation
   */
  async followUser(
    followeeUserId: number,
    isUnfollow: boolean
  ): Promise<EntityManagerOperationResponse> {
    const responseValues: EntityManagerOperationResponse =
      this.getDefaultEntityManagerResponseValues()
    try {
      // TODO: Can we consolidate this initial flow somehow since it is repeated
      const userId: number | null = this.userStateManager.getCurrentUserId()
      if (!userId) {
        responseValues.error = 'Missing current user ID'
        return responseValues
      }
      const resp = await this.manageEntity({
        userId,
        entityType: EntityType.USER,
        entityId: followeeUserId,
        action: isUnfollow ? Action.UNFOLLOW : Action.FOLLOW,
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
  ): Promise<EntityManagerOperationResponse> {
    const responseValues: EntityManagerOperationResponse =
      this.getDefaultEntityManagerResponseValues()

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

      const trackIds = this.mapTimestamps(playlist.playlist_contents.track_ids)

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
