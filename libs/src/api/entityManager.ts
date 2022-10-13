import { Base, Services } from './base'
import type { PlaylistMetadata } from '../services/creatorNode'

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow',
  SAVE = 'Save',
  UNSAVE = 'Unsave',
  REPOST = 'Repost',
  UNREPOST = 'Unrepost'
}

export enum EntityType {
  TRACK = 'Track',
  PLAYLIST = 'Playlist',
  USER = 'User'
}

export type EntityManagerSuccessResponse = {
  blockHash: string
  blockNumber: number
  error: null
}
export type EntityManagerErrorResponse = {
  blockHash: null
  blockNumber: null
  error: string
}

export type EntityManagerResponse =
  | EntityManagerSuccessResponse
  | EntityManagerErrorResponse

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

  mapTimestamps(addedTimestamps: PlaylistTrack[]) {
    const trackIds = addedTimestamps.map((trackObj) => ({
      track: trackObj.track,
      time: trackObj.metadata_time ?? trackObj.time // default to time for legacy playlists
    }))

    return trackIds
  }

  getCurrentUserId() {
    const userId: number | null = this.userStateManager.getCurrentUserId()
    if (!userId) {
      throw new Error('Missing current user ID')
    }
    return userId
  }

  getDefaultEntityManagerResponseValues(): EntityManagerResponse {
    return {
      blockHash: null,
      blockNumber: null,
      error: ''
    }
  }

  /** Social Features */
  createSocialMethod =
    (entityType: EntityType, action: Action) =>
    async (entityId: number): Promise<EntityManagerResponse> => {
      const responseValues: EntityManagerResponse =
        this.getDefaultEntityManagerResponseValues()
      try {
        return await this.manageEntity({
          userId: this.getCurrentUserId(),
          entityType,
          entityId,
          action,
          metadataMultihash: ''
        })
      } catch (e) {
        const error = (e as Error).message
        responseValues.error = error
        return responseValues
      }
    }

  followUser = this.createSocialMethod(EntityType.USER, Action.FOLLOW)
  unfollowUser = this.createSocialMethod(EntityType.USER, Action.UNFOLLOW)
  saveTrack = this.createSocialMethod(EntityType.TRACK, Action.SAVE)
  unsaveTrack = this.createSocialMethod(EntityType.TRACK, Action.UNSAVE)
  savePlaylist = this.createSocialMethod(EntityType.PLAYLIST, Action.SAVE)
  unsavePlaylist = this.createSocialMethod(EntityType.PLAYLIST, Action.UNSAVE)
  repostTrack = this.createSocialMethod(EntityType.TRACK, Action.REPOST)
  unrepostTrack = this.createSocialMethod(EntityType.TRACK, Action.UNREPOST)

  /** Playlist */

  async createPlaylist(
    playlist: PlaylistParam
  ): Promise<EntityManagerResponse> {
    const responseValues: EntityManagerResponse =
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
      return await this.manageEntity({
        userId: userId,
        entityType,
        entityId: playlist.playlist_id,
        action: createAction,
        metadataMultihash
      })
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  async deletePlaylist(playlistId: number): Promise<EntityManagerResponse> {
    const responseValues: EntityManagerResponse =
      this.getDefaultEntityManagerResponseValues()
    const userId: number | null = this.userStateManager.getCurrentUserId()
    if (!userId) {
      responseValues.error = 'Missing current user ID'
      return responseValues
    }
    try {
      return await this.manageEntity({
        userId,
        entityType: EntityType.PLAYLIST,
        entityId: playlistId,
        action: Action.DELETE,
        metadataMultihash: ''
      })
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }

  async updatePlaylist(
    playlist: PlaylistParam
  ): Promise<EntityManagerResponse> {
    const responseValues: EntityManagerResponse =
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
      return await this.manageEntity({
        userId,
        entityType,
        entityId: playlist.playlist_id,
        action: updateAction,
        metadataMultihash
      })
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
    metadataMultihash?: string
  }): Promise<EntityManagerResponse> {
    const responseValues: EntityManagerResponse =
      this.getDefaultEntityManagerResponseValues()
    try {
      if (this.contracts.EntityManagerClient === undefined) {
        throw new Error('EntityManagerClient is undefined')
      }

      const resp = await this.contracts.EntityManagerClient.manageEntity(
        userId,
        entityType,
        entityId,
        action,
        metadataMultihash ?? ''
      )
      responseValues.blockHash = resp.txReceipt.blockHash
      responseValues.blockNumber = resp.txReceipt.blockNumber
      return responseValues
    } catch (e) {
      const error = (e as Error).message
      responseValues.error = error
      return responseValues
    }
  }
}
