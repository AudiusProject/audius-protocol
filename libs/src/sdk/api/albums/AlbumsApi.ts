import type { AuthService, StorageService } from '../../services'
import type {
  EntityManagerService,
  WriteOptions
} from '../../services/EntityManager/types'
import { parseRequestParameters } from '../../utils/parseRequestParameters'
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
    auth: AuthService
  ) {
    this.playlistsApi = new PlaylistsApi(
      configuration,
      storage,
      entityManager,
      auth
    )
  }

  // READS
  async getAlbum(requestParameters: getAlbumRequest) {
    const { userId, albumId } = requestParameters
    return await this.playlistsApi.getPlaylist({ userId, playlistId: albumId })
  }

  async getAlbumTracks(requestParameters: getAlbumTracksRequest) {
    const { albumId } = requestParameters
    return await this.playlistsApi.getPlaylistTracks({ playlistId: albumId })
  }

  // WRITES
  /**
   * Upload an album
   * Uploads the specified tracks and combines them into an album
   */
  async uploadAlbum(
    requestParameters: UploadAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { metadata, ...parsedParameters } = parseRequestParameters(
      'uploadAlbum',
      createUploadAlbumSchema()
    )(requestParameters)

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

  /**
   * Update an album
   */
  async updateAlbum(
    requestParameters: UpdateAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { albumId, metadata, ...parsedParameters } = parseRequestParameters(
      'updateAlbum',
      createUpdateAlbumSchema()
    )(requestParameters)

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

  /**
   * Delete an album
   */
  async deleteAlbum(
    requestParameters: DeleteAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    parseRequestParameters('deleteAlbum', DeleteAlbumSchema)(requestParameters)

    return await this.playlistsApi.deletePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.albumId
      },
      writeOptions
    )
  }

  /**
   * Favorite an album
   */
  async favoriteAlbum(
    requestParameters: FavoriteAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { metadata } = parseRequestParameters(
      'favoriteAlbum',
      FavoriteAlbumSchema
    )(requestParameters)
    return await this.playlistsApi.favoritePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.albumId,
        metadata
      },
      writeOptions
    )
  }

  /**
   * Unfavorite an album
   */
  async unfavoriteAlbum(
    requestParameters: UnfavoriteAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    parseRequestParameters(
      'unfavoriteAlbum',
      UnfavoriteAlbumSchema
    )(requestParameters)
    return await this.playlistsApi.unfavoritePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.albumId
      },
      writeOptions
    )
  }

  /**
   * Repost an album
   */
  async repostAlbum(
    requestParameters: RepostAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { metadata } = parseRequestParameters(
      'repostAlbum',
      RepostAlbumSchema
    )(requestParameters)

    return await this.playlistsApi.repostPlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.albumId,
        metadata
      },
      writeOptions
    )
  }

  /**
   * Unrepost an album
   */
  async unrepostAlbum(
    requestParameters: UnrepostAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    parseRequestParameters(
      'unrepostAlbum',
      UnrepostAlbumSchema
    )(requestParameters)
    return await this.playlistsApi.unrepostPlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.albumId
      },
      writeOptions
    )
  }
}
