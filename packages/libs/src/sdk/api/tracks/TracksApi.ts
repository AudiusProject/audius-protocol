import snakecaseKeys from 'snakecase-keys'

import type { EntityManagerService, AuthService } from '../../services'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector'
import {
  Action,
  EntityType,
  AdvancedOptions
} from '../../services/EntityManager/types'
import type { LoggerService } from '../../services/Logger'
import type { StorageService } from '../../services/Storage'
import { encodeHashId } from '../../utils/hashId'
import { parseParams } from '../../utils/parseParams'
import { retry3 } from '../../utils/retry'
import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi
} from '../generated/default'
import { BASE_PATH, RequiredError } from '../generated/default/runtime'

import { TrackUploadHelper } from './TrackUploadHelper'
import {
  createUpdateTrackSchema,
  createUploadTrackSchema,
  DeleteTrackRequest,
  DeleteTrackSchema,
  RepostTrackRequest,
  RepostTrackSchema,
  FavoriteTrackRequest,
  FavoriteTrackSchema,
  UnrepostTrackRequest,
  UnrepostTrackSchema,
  UnfavoriteTrackRequest,
  UnfavoriteTrackSchema,
  UpdateTrackRequest,
  UploadTrackRequest
} from './types'

// Extend that new class
export class TracksApi extends GeneratedTracksApi {
  private readonly trackUploadHelper: TrackUploadHelper

  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService
  ) {
    super(configuration)
    this.trackUploadHelper = new TrackUploadHelper(configuration)
    this.logger = logger.createPrefixedLogger('[tracks-api]')
  }

  /**
   * Get the url of the track's streamable mp3 file
   */
  // @ts-expect-error
  override async streamTrack(params: StreamTrackRequest): Promise<string> {
    if (params.trackId === null || params.trackId === undefined) {
      throw new RequiredError(
        'trackId',
        'Required parameter params.trackId was null or undefined when calling getTrack.'
      )
    }

    const path = `/tracks/{track_id}/stream`.replace(
      `{${'track_id'}}`,
      encodeURIComponent(String(params.trackId))
    )
    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    return `${host}${BASE_PATH}${path}`
  }

  /** @hidden
   * Upload a track
   */
  async uploadTrack(
    params: UploadTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    this.logger.info('Parsing inputs')
    const {
      userId,
      trackFile,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress
    } = await parseParams('uploadTrack', createUploadTrackSchema())(params)

    // Transform metadata
    this.logger.info('Transforming metadata')
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )
    const uploadOptions: { [key: string]: string } = {}
    if (metadata.previewStartSeconds) {
      uploadOptions.previewStartSeconds =
        metadata.previewStartSeconds.toString()
    }

    // Upload track audio and cover art to storage node
    this.logger.info('Uploading track audio and cover art')
    const [coverArtResponse, audioResponse] = await Promise.all([
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          this.logger.info('Retrying uploadTrackCoverArt', e)
        }
      ),
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: trackFile,
            onProgress,
            template: 'audio',
            options: uploadOptions
          }),
        (e) => {
          this.logger.info('Retrying uploadTrackAudio', e)
        }
      )
    ])

    // Update metadata to include uploaded CIDs
    const updatedMetadata =
      this.trackUploadHelper.populateTrackMetadataWithUploadResponse(
        metadata,
        audioResponse,
        coverArtResponse
      )

    // Write metadata to chain
    this.logger.info('Writing metadata to chain')
    const trackId = await this.trackUploadHelper.generateId('track')
    const response = await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...advancedOptions
    })

    this.logger.info('Successfully uploaded track')
    return {
      ...response,
      trackId: encodeHashId(trackId)
    }
  }

  /** @hidden
   * Update a track
   */
  async updateTrack(
    params: UpdateTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const {
      userId,
      trackId,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress,
      transcodePreview
    } = await parseParams('updateTrack', createUpdateTrackSchema())(params)

    // Transform metadata
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )

    // Upload track cover art to storage node
    const coverArtResp =
      coverArtFile &&
      (await retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          this.logger.info('Retrying uploadTrackCoverArt', e)
        }
      ))

    // Update metadata to include uploaded CIDs
    const updatedMetadata = {
      ...metadata,
      ...(coverArtResp ? { coverArtSizes: coverArtResp.id } : {})
    }

    if (transcodePreview) {
      if (!updatedMetadata.previewStartSeconds) {
        throw new Error('No track preview start time specified')
      }
      if (!updatedMetadata.audioUploadId) {
        throw new Error('Missing required audio_upload_id')
      }

      // Transocde track preview
      const editFileData = {
        previewStartSeconds: updatedMetadata.previewStartSeconds!.toString()
      }
      const updatePreviewResp = await retry3(
        async () =>
          await this.storage.editFile({
            uploadId: updatedMetadata.audioUploadId!,
            data: editFileData,
            auth: this.auth
          }),
        (e) => {
          this.logger.info('Retrying editFileV2', e)
        }
      )

      // Update metadata to include updated preview CID
      const previewKey = `320_preview|${updatedMetadata.previewStartSeconds}`
      updatedMetadata.previewCid = updatePreviewResp.results[previewKey]
    }

    // Write metadata to chain
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: '',
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...advancedOptions
    })
  }

  /** @hidden
   * Delete a track
   */
  async deleteTrack(
    params: DeleteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'deleteTrack',
      DeleteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.DELETE,
      auth: this.auth,
      ...advancedOptions
    })
  }

  /** @hidden
   * Favorite a track
   */
  async favoriteTrack(
    params: FavoriteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = await parseParams(
      'favoriteTrack',
      FavoriteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.SAVE,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...advancedOptions
    })
  }

  /** @hidden
   * Unfavorite a track
   */
  async unfavoriteTrack(
    params: UnfavoriteTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'unfavoriteTrack',
      UnfavoriteTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNSAVE,
      auth: this.auth,
      ...advancedOptions
    })
  }

  /** @hidden
   * Repost a track
   */
  async repostTrack(
    params: RepostTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = await parseParams(
      'respostTrack',
      RepostTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.REPOST,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...advancedOptions
    })
  }

  /** @hidden
   * Unrepost a track
   */
  async unrepostTrack(
    params: UnrepostTrackRequest,
    advancedOptions?: AdvancedOptions
  ) {
    // Parse inputs
    const { userId, trackId } = await parseParams(
      'unrepostTrack',
      UnrepostTrackSchema
    )(params)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNREPOST,
      auth: this.auth,
      ...advancedOptions
    })
  }
}
