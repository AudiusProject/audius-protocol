import type { AuthService, StorageService } from '../../services'
import type {
  EntityManagerService,
  WriteOptions
} from '../../services/EntityManager/types'
import type { LoggerService } from '../../services/Logger'
import { parseparams } from '../../utils/parseparams'
import type { Configuration } from '../generated/default'
import { PlaylistsApi } from '../playlists/PlaylistsApi'
import {
  createUpdateAlbumSchema,
  createUploadAlbumSchema,
  DeleteAlbumRequest,
  DeleteAlbumSchema,
  FavoriteAlbumRequest,
  FavoriteAlbumSchema,
  getAlbumRequest,
  getAlbumTracksRequest,
  RepostAlbumRequest,
  RepostAlbumSchema,
  UnfavoriteAlbumRequest,
  UnfavoriteAlbumSchema,
  UnrepostAlbumRequest,
  UnrepostAlbumSchema,
  UpdateAlbumRequest,
  UploadAlbumRequest
} from './types'

export class AlbumsApi {
  private readonly playlistsApi: PlaylistsApi
  constructor(
    configuration: Configuration,
    storage: StorageService,
    entityManager: EntityManagerService,
    auth: AuthService,
    logger: LoggerService
  ) {
    this.playlistsApi = new PlaylistsApi(
      configuration,
      storage,
      entityManager,
      auth,
      logger
    )
  }

  // READS
  async getAlbum(params: getAlbumRequest) {
    const { userId, albumId } = params
    return await this.playlistsApi.getPlaylist({ userId, playlistId: albumId })
  }

  async getAlbumTracks(params: getAlbumTracksRequest) {
    const { albumId } = params
    return await this.playlistsApi.getPlaylistTracks({ playlistId: albumId })
  }

  // WRITES
  /** @hidden
   * Upload an album
   * Uploads the specified tracks and combines them into an album
   */
  async uploadAlbum(params: UploadAlbumRequest, writeOptions?: WriteOptions) {
    const { metadata, ...parsedParameters } = await parseparams(
      'uploadAlbum',
      createUploadAlbumSchema()
    )(params)

    const { albumName, ...playlistMetadata } = metadata

    // Call uploadPlaylistInternal with parsed inputs
    const response = await this.playlistsApi.uploadPlaylistInternal(
      {
        ...parsedParameters,
        metadata: {
          ...playlistMetadata,
          playlistName: albumName,
          isAlbum: true
        }
      },
      writeOptions
    )

    return {
      blockHash: response.blockHash,
      blockNumber: response.blockNumber,
      albumId: response.playlistId
    }
  }

  /** @hidden
   * Update an album
   */
  async updateAlbum(params: UpdateAlbumRequest, writeOptions?: WriteOptions) {
    const { albumId, metadata, ...parsedParameters } = await parseparams(
      'updateAlbum',
      createUpdateAlbumSchema()
    )(params)

    const { albumName, ...playlistMetadata } = metadata

    // Call updatePlaylistInternal with parsed inputs
    return await this.playlistsApi.updatePlaylistInternal(
      {
        ...parsedParameters,
        playlistId: albumId,
        metadata: {
          ...playlistMetadata,
          playlistName: albumName
        }
      },
      writeOptions
    )
  }

  /** @hidden
   * Delete an album
   */
  async deleteAlbum(params: DeleteAlbumRequest, writeOptions?: WriteOptions) {
    await parseparams('deleteAlbum', DeleteAlbumSchema)(params)

    return await this.playlistsApi.deletePlaylist(
      {
        userId: params.userId,
        playlistId: params.albumId
      },
      writeOptions
    )
  }

  /** @hidden
   * Favorite an album
   */
  async favoriteAlbum(
    params: FavoriteAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { metadata } = await parseparams(
      'favoriteAlbum',
      FavoriteAlbumSchema
    )(params)
    return await this.playlistsApi.favoritePlaylist(
      {
        userId: params.userId,
        playlistId: params.albumId,
        metadata
      },
      writeOptions
    )
  }

  /** @hidden
   * Unfavorite an album
   */
  async unfavoriteAlbum(
    params: UnfavoriteAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    await parseparams('unfavoriteAlbum', UnfavoriteAlbumSchema)(params)
    return await this.playlistsApi.unfavoritePlaylist(
      {
        userId: params.userId,
        playlistId: params.albumId
      },
      writeOptions
    )
  }

  /** @hidden
   * Repost an album
   */
  async repostAlbum(params: RepostAlbumRequest, writeOptions?: WriteOptions) {
    const { metadata } = await parseparams(
      'repostAlbum',
      RepostAlbumSchema
    )(params)

    return await this.playlistsApi.repostPlaylist(
      {
        userId: params.userId,
        playlistId: params.albumId,
        metadata
      },
      writeOptions
    )
  }

  /** @hidden
   * Unrepost an album
   */
  async unrepostAlbum(
    params: UnrepostAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    await parseparams('unrepostAlbum', UnrepostAlbumSchema)(params)
    return await this.playlistsApi.unrepostPlaylist(
      {
        userId: params.userId,
        playlistId: params.albumId
      },
      writeOptions
    )
  }
}
