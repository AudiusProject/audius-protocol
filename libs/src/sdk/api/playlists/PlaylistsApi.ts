import snakecaseKeys from 'snakecase-keys'
import type { z } from 'zod'

import type { AuthService, StorageService } from '../../services'
import {
  Action,
  EntityManagerService,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'
import { parseRequestParameters } from '../../utils/parseRequestParameters'
import {
  Configuration,
  PlaylistsApi as GeneratedPlaylistsApi
} from '../generated/default'
import {
  AddTrackToPlaylistRequest,
  AddTrackToPlaylistSchema,
  CreatePlaylistRequest,
  CreatePlaylistSchema,
  createUpdatePlaylistSchema,
  createUploadPlaylistSchema,
  DeletePlaylistRequest,
  DeletePlaylistSchema,
  PlaylistMetadata,
  PlaylistTrackMetadata,
  PublishPlaylistRequest,
  PublishPlaylistSchema,
  RemoveTrackFromPlaylistRequest,
  RemoveTrackFromPlaylistSchema,
  RepostPlaylistRequest,
  RepostPlaylistSchema,
  FavoritePlaylistRequest,
  FavoritePlaylistSchema,
  UnrepostPlaylistSchema,
  UnfavoritePlaylistRequest,
  UnfavoritePlaylistSchema,
  UpdatePlaylistRequest,
  UploadPlaylistRequest,
  createUpdatePlaylistMetadataSchema
} from './types'
import { retry3 } from '../../utils/retry'
import { generateMetadataCidV1 } from '../../utils/cid'
import { TrackUploadHelper } from '../tracks/TrackUploadHelper'
import { encodeHashId } from '../../utils/hashId'
import { pick } from 'lodash'

export class PlaylistsApi extends GeneratedPlaylistsApi {
  private readonly trackUploadHelper: TrackUploadHelper

  constructor(
    configuration: Configuration,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(configuration)
    this.trackUploadHelper = new TrackUploadHelper(configuration)
  }

  /**
   * Create a playlist from existing tracks
   */
  async createPlaylist(
    requestParameters: CreatePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, coverArtFile, metadata, onProgress, trackIds } =
      await parseRequestParameters(
        'createPlaylist',
        CreatePlaylistSchema
      )(requestParameters)

    // Upload cover art to storage node
    const coverArtResponse =
      coverArtFile &&
      (await retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          console.log('Retrying uploadPlaylistCoverArt', e)
        }
      ))

    const playlistId = await this.trackUploadHelper.generateId('playlist')
    const currentBlock = await this.entityManager.getCurrentBlock()

    // Update metadata to include track ids
    const updatedMetadata = {
      ...metadata,
      playlistContents: {
        trackIds: (trackIds ?? []).map((trackId) => ({
          track: trackId,
          time: currentBlock.timestamp
        }))
      },
      playlistImageSizesMultihash: coverArtResponse?.id
    }

    // Write playlist metadata to chain
    const metadataCid = await generateMetadataCidV1(updatedMetadata)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...writeOptions
    })

    return {
      ...response,
      playlistId: encodeHashId(playlistId)
    }
  }

  /**
   * Upload a playlist
   * Uploads the specified tracks and combines them into a playlist
   */
  async uploadPlaylist(
    requestParameters: UploadPlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const parsedParameters = await parseRequestParameters(
      'uploadPlaylist',
      createUploadPlaylistSchema()
    )(requestParameters)

    // Call uploadPlaylistInternal with parsed inputs
    return await this.uploadPlaylistInternal(parsedParameters, writeOptions)
  }

  /**
   * Publish a playlist
   * Changes a playlist from private to public
   */
  async publishPlaylist(
    requestParameters: PublishPlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    await parseRequestParameters(
      'publishPlaylist',
      PublishPlaylistSchema
    )(requestParameters)

    return await this.fetchAndUpdatePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.playlistId,
        updateMetadata: (playlist) => ({
          ...playlist,
          isPrivate: false
        })
      },
      writeOptions
    )
  }

  /**
   * Add a single track to the end of a playlist
   * For more control use updatePlaylist
   */
  async addTrackToPlaylist(
    requestParameters: AddTrackToPlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    await parseRequestParameters(
      'addTrackToPlaylist',
      AddTrackToPlaylistSchema
    )(requestParameters)

    const currentBlock = await this.entityManager.getCurrentBlock()

    return await this.fetchAndUpdatePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.playlistId,
        updateMetadata: (playlist) => ({
          ...playlist,
          playlistContents: [
            ...(playlist.playlistContents ?? []),
            {
              trackId: requestParameters.trackId,
              timestamp: currentBlock.timestamp
            }
          ]
        })
      },
      writeOptions
    )
  }

  /**
   * Removes a single track at the given index of playlist
   * For more control use updatePlaylist
   */
  async removeTrackFromPlaylist(
    requestParameters: RemoveTrackFromPlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { trackIndex } = await parseRequestParameters(
      'removeTrackFromPlaylist',
      RemoveTrackFromPlaylistSchema
    )(requestParameters)

    return await this.fetchAndUpdatePlaylist(
      {
        userId: requestParameters.userId,
        playlistId: requestParameters.playlistId,
        updateMetadata: (playlist) => {
          if (
            !playlist.playlistContents ||
            playlist.playlistContents.length <= trackIndex
          ) {
            throw new Error(`No track exists at index ${trackIndex}`)
          }
          playlist.playlistContents.splice(trackIndex, 1)
          return {
            ...playlist,
            playlistContents: playlist.playlistContents
          }
        }
      },
      writeOptions
    )
  }

  /**
   * Update a playlist
   */
  async updatePlaylist(
    requestParameters: UpdatePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const parsedParameters = await parseRequestParameters(
      'updatePlaylist',
      createUpdatePlaylistSchema()
    )(requestParameters)

    // Call updatePlaylistInternal with parsed inputs
    return await this.updatePlaylistInternal(parsedParameters, writeOptions)
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(
    requestParameters: DeletePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, playlistId } = await parseRequestParameters(
      'deletePlaylist',
      DeletePlaylistSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.DELETE,
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Favorite a playlist
   */
  async favoritePlaylist(
    requestParameters: FavoritePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, playlistId, metadata } = await parseRequestParameters(
      'favoritePlaylist',
      FavoritePlaylistSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.SAVE,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Unfavorite a playlist
   */
  async unfavoritePlaylist(
    requestParameters: UnfavoritePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, playlistId } = await parseRequestParameters(
      'unfavoritePlaylist',
      UnfavoritePlaylistSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.UNSAVE,
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Repost a playlist
   */
  async repostPlaylist(
    requestParameters: RepostPlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, playlistId, metadata } = await parseRequestParameters(
      'respostPlaylist',
      RepostPlaylistSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.REPOST,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Unrepost a playlist
   */
  async unrepostPlaylist(
    requestParameters: FavoritePlaylistRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, playlistId } = await parseRequestParameters(
      'unrepostPlaylist',
      UnrepostPlaylistSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.UNREPOST,
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Combines the metadata for a track and a collection (playlist or album),
   * taking the metadata from the playlist when the track is missing it.
   */
  private combineMetadata(
    trackMetadata: PlaylistTrackMetadata,
    playlistMetadata: PlaylistMetadata
  ) {
    const metadata = trackMetadata

    if (!metadata.mood) metadata.mood = playlistMetadata.mood

    if (playlistMetadata.tags) {
      if (!metadata.tags) {
        // Take playlist tags
        metadata.tags = playlistMetadata.tags
      } else {
        // Combine tags and dedupe
        metadata.tags = [
          ...new Set([
            ...metadata.tags.split(','),
            ...playlistMetadata.tags.split(',')
          ])
        ].join(',')
      }
    }
    return trackMetadata
  }

  /**
   * Update helper method that first fetches a playlist and then updates it
   */
  private async fetchAndUpdatePlaylist(
    {
      userId,
      playlistId,
      updateMetadata
    }: {
      userId: string
      playlistId: string
      updateMetadata: (
        fetchedMetadata: UpdatePlaylistRequest['metadata']
      ) => UpdatePlaylistRequest['metadata']
    },
    writeOptions?: WriteOptions
  ) {
    // Fetch playlist
    const playlistResponse = await this.getPlaylist({
      playlistId,
      userId
    })
    const playlist = playlistResponse.data?.[0]

    if (!playlist) {
      throw new Error(`Could not fetch playlist: ${playlistId}`)
    }

    const supportedUpdateFields = Object.keys(
      createUpdatePlaylistMetadataSchema().shape
    )

    return await this.updatePlaylist(
      {
        userId,
        playlistId,
        metadata: updateMetadata(pick(playlist, supportedUpdateFields))
      },
      writeOptions
    )
  }

  /**
   * Method to upload a playlist with already parsed inputs
   * This is used for both playlists and albums
   */
  public async uploadPlaylistInternal<Metadata extends PlaylistMetadata>(
    {
      userId,
      coverArtFile,
      trackFiles,
      onProgress,
      metadata,
      trackMetadatas
    }: z.infer<ReturnType<typeof createUploadPlaylistSchema>> & {
      metadata: Metadata
    },
    writeOptions?: WriteOptions
  ) {
    // Upload track audio and cover art to storage node
    const [coverArtResponse, ...audioResponses] = await Promise.all([
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          console.log('Retrying uploadPlaylistCoverArt', e)
        }
      ),
      ...trackFiles.map(
        async (trackFile) =>
          await retry3(
            async () =>
              await this.storage.uploadFile({
                file: trackFile,
                onProgress,
                template: 'audio'
              }),
            (e) => {
              console.log('Retrying uploadTrackAudio', e)
            }
          )
      )
    ])

    // Write tracks to chain
    const trackIds = await Promise.all(
      trackMetadatas.map(async (parsedTrackMetadata, i) => {
        // Transform track metadata
        const trackMetadata = this.combineMetadata(
          this.trackUploadHelper.transformTrackUploadMetadata(
            parsedTrackMetadata,
            userId
          ),
          metadata
        )

        const audioResponse = audioResponses[i]

        if (!audioResponse) {
          throw new Error(`Failed to upload track: ${trackMetadata.title}`)
        }

        // Update metadata to include uploaded CIDs
        const updatedMetadata =
          this.trackUploadHelper.populateTrackMetadataWithUploadResponse(
            trackMetadata,
            audioResponse,
            coverArtResponse
          )

        const metadataCid = await generateMetadataCidV1(updatedMetadata)
        const trackId = await this.trackUploadHelper.generateId('track')
        await this.entityManager.manageEntity({
          userId,
          entityType: EntityType.TRACK,
          entityId: trackId,
          action: Action.CREATE,
          metadata: JSON.stringify({
            cid: metadataCid.toString(),
            data: snakecaseKeys(updatedMetadata)
          }),
          auth: this.auth,
          ...writeOptions
        })

        return trackId
      })
    )

    const playlistId = await this.trackUploadHelper.generateId('playlist')
    const currentBlock = await this.entityManager.getCurrentBlock()

    // Update metadata to include track ids and cover art cid
    const updatedMetadata = {
      ...metadata,
      isPrivate: false,
      playlistContents: {
        trackIds: trackIds.map((trackId) => ({
          track: trackId,
          time: currentBlock.timestamp
        }))
      },
      playlistImageSizesMultihash: coverArtResponse.id
    }

    // Write playlist metadata to chain
    const metadataCid = await generateMetadataCidV1(updatedMetadata)

    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...writeOptions
    })
    return {
      ...response,
      playlistId: encodeHashId(playlistId)
    }
  }

  /**
   * Method to update a playlist with already parsed inputs
   * This is used for both playlists and albums
   */
  public async updatePlaylistInternal<
    Metadata extends Partial<PlaylistMetadata>
  >(
    {
      userId,
      playlistId,
      coverArtFile,
      onProgress,
      metadata
    }: z.infer<ReturnType<typeof createUpdatePlaylistSchema>> & {
      metadata: Metadata
    },
    writeOptions?: WriteOptions
  ) {
    // Upload cover art to storage node
    const coverArtResponse =
      coverArtFile &&
      (await retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          console.log('Retrying uploadPlaylistCoverArt', e)
        }
      ))

    const updatedMetadata = {
      ...metadata,
      ...(metadata.playlistContents
        ? {
            playlistContents: {
              trackIds: metadata.playlistContents.map(
                ({ trackId, metadataTimestamp, timestamp }) => ({
                  track: trackId,
                  // default to timestamp for legacy playlists
                  time: metadataTimestamp ?? timestamp
                })
              )
            }
          }
        : {}),
      ...(coverArtResponse
        ? { playlistImageSizesMultihash: coverArtResponse.id }
        : {})
    }

    const metadataCid = await generateMetadataCidV1(updatedMetadata)
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.PLAYLIST,
      entityId: playlistId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...writeOptions
    })
  }
}
