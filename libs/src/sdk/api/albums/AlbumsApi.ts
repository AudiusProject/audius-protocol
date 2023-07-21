import type { AuthService, StorageService } from '../../services'
import type {
  EntityManagerService,
  WriteOptions
} from '../../services/EntityManager/types'
import type { Configuration } from '../generated/default'
import { PlaylistsApi } from '../playlists/PlaylistsApi'
import type {
  DeleteAlbumRequest,
  FavoriteAlbumRequest,
  getAlbumRequest,
  getAlbumTracksRequest,
  RepostAlbumRequest,
  UnfavoriteAlbumRequest,
  UnrepostAlbumRequest,
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
    const {
      metadata,
      trackMetadatas,
      trackFiles,
      onProgress,
      coverArtFile,
      userId
    } = requestParameters

    const { albumName, ...playlistMetadata } = metadata
    const playlistRes = await this.playlistsApi.uploadPlaylist(
      {
        userId,
        coverArtFile,
        onProgress,
        trackFiles,
        trackMetadatas,
        metadata: {
          ...playlistMetadata,
          playlistName: albumName
        }
      },
      writeOptions
    )

    return {
      blockHash: playlistRes.blockHash,
      blockNumber: playlistRes.blockNumber,
      albumId: playlistRes.playlistId
    }
  }

  /**
   * Update an album
   */
  async updateAlbum(
    requestParameters: UpdateAlbumRequest,
    writeOptions?: WriteOptions
  ) {
    const { userId, albumId, metadata, onProgress, coverArtFile } =
      requestParameters

    return await this.playlistsApi.updatePlaylist(
      {
        userId,
        playlistId: albumId,
        coverArtFile,
        onProgress,
        metadata: {
          description: metadata.description,
          mood: metadata.mood,
          playlistName: metadata.albumName,
          releaseDate: metadata.releaseDate,
          tags: metadata.tags,
          upc: metadata.upc
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
    const { userId, albumId } = requestParameters
    return await this.playlistsApi.deletePlaylist(
      { userId, playlistId: albumId },
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
    const { userId, albumId, metadata } = requestParameters
    return await this.playlistsApi.favoritePlaylist(
      { userId, playlistId: albumId, metadata },
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
    const { userId, albumId } = requestParameters
    return await this.playlistsApi.unfavoritePlaylist(
      { userId, playlistId: albumId },
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
    const { userId, albumId, metadata } = requestParameters
    return await this.playlistsApi.repostPlaylist(
      { userId, playlistId: albumId, metadata },
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
    const { userId, albumId } = requestParameters
    return await this.playlistsApi.unrepostPlaylist(
      { userId, playlistId: albumId },
      writeOptions
    )
  }
}
