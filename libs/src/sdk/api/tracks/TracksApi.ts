import snakecaseKeys from 'snakecase-keys'
import { BaseAPI, BASE_PATH, RequiredError } from '../generated/default/runtime'

import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi
} from '../generated/default'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector'
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
import type { StorageService } from '../../services/Storage'
import { retry3 } from '../../utils/retry'
import type { EntityManagerService, AuthService } from '../../services'
import {
  Action,
  EntityType,
  WriteOptions
} from '../../services/EntityManager/types'
import { generateMetadataCidV1 } from '../../utils/cid'
import { parseRequestParameters } from '../../utils/parseRequestParameters'
import { TrackUploadHelper } from './TrackUploadHelper'
import { encodeHashId } from '../../utils/hashId'

// Subclass type masking adapted from Damir Arh's method:
// https://www.damirscorner.com/blog/posts/20190712-ChangeMethodSignatureInTypescriptSubclass.html
// Get the type of the generated TracksApi excluding streamTrack
type GeneratedTracksApiWithoutStream = new (config: Configuration) => {
  [P in Exclude<keyof GeneratedTracksApi, 'streamTrack'>]: GeneratedTracksApi[P]
} & BaseAPI

// Create a new "class" that masks our generated TracksApi with the new type
const TracksApiWithoutStream: GeneratedTracksApiWithoutStream =
  GeneratedTracksApi

// Extend that new class
export class TracksApi extends TracksApiWithoutStream {
  private readonly trackUploadHelper: TrackUploadHelper

  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly auth: AuthService
  ) {
    super(configuration)
    this.trackUploadHelper = new TrackUploadHelper(configuration)
  }

  /**
   * Get the url of the track's streamable mp3 file
   */
  async streamTrack(requestParameters: StreamTrackRequest): Promise<string> {
    if (
      requestParameters.trackId === null ||
      requestParameters.trackId === undefined
    ) {
      throw new RequiredError(
        'trackId',
        'Required parameter requestParameters.trackId was null or undefined when calling getTrack.'
      )
    }

    const path = `/tracks/{track_id}/stream`.replace(
      `{${'track_id'}}`,
      encodeURIComponent(String(requestParameters.trackId))
    )
    const host = await this.discoveryNodeSelectorService.getSelectedEndpoint()
    return `${host}${BASE_PATH}${path}`
  }

  /**
   * Upload a track
   */
  async uploadTrack(
    requestParameters: UploadTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const {
      userId,
      trackFile,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress
    } = parseRequestParameters(
      'uploadTrack',
      createUploadTrackSchema()
    )(requestParameters)

    // Transform metadata
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )
    const uploadOptions: { [key: string]: string } = {}
    if (metadata.previewStartSeconds) {
      uploadOptions['previewStartSeconds'] =
        metadata.previewStartSeconds.toString()
    }

    // Upload track audio and cover art to storage node
    const [coverArtResponse, audioResponse] = await Promise.all([
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: coverArtFile,
            onProgress,
            template: 'img_square'
          }),
        (e) => {
          console.log('Retrying uploadTrackCoverArt', e)
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
          console.log('Retrying uploadTrackAudio', e)
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
    const metadataCid = await generateMetadataCidV1(updatedMetadata)
    const trackId = await this.trackUploadHelper.generateId('track')
    const response = await this.entityManager.manageEntity({
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
    return {
      ...response,
      trackId: encodeHashId(trackId)
    }
  }

  /**
   * Update a track
   */
  async updateTrack(
    requestParameters: UpdateTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const {
      userId,
      trackId,
      coverArtFile,
      metadata: parsedMetadata,
      onProgress,
      transcodePreview
    } = parseRequestParameters(
      'updateTrack',
      createUpdateTrackSchema()
    )(requestParameters)

    // Transform metadata
    const metadata = this.trackUploadHelper.transformTrackUploadMetadata(
      parsedMetadata,
      userId
    )

    // Upload track cover art to storage node
    const coverArtResp = await retry3(
      async () =>
        await this.storage.uploadFile({
          file: coverArtFile,
          onProgress,
          template: 'img_square'
        }),
      (e) => {
        console.log('Retrying uploadTrackCoverArt', e)
      }
    )

    // Update metadata to include uploaded CIDs
    const updatedMetadata = {
      ...metadata,
      coverArtSizes: coverArtResp.id
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
          console.log('Retrying editFileV2', e)
        }
      )

      // Update metadata to include updated preview CID
      const previewKey = `320_preview|${updatedMetadata.previewStartSeconds}`
      updatedMetadata.previewCid = updatePreviewResp.results[previewKey]
    }

    // Write metadata to chain
    const metadataCid = await generateMetadataCidV1(updatedMetadata)
    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UPDATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: snakecaseKeys(updatedMetadata)
      }),
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Delete a track
   */
  async deleteTrack(
    requestParameters: DeleteTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, trackId } = parseRequestParameters(
      'deleteTrack',
      DeleteTrackSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.DELETE,
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Favorite a track
   */
  async favoriteTrack(
    requestParameters: FavoriteTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = parseRequestParameters(
      'favoriteTrack',
      FavoriteTrackSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.SAVE,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Unfavorite a track
   */
  async unfavoriteTrack(
    requestParameters: UnfavoriteTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, trackId } = parseRequestParameters(
      'unfavoriteTrack',
      UnfavoriteTrackSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNSAVE,
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Repost a track
   */
  async repostTrack(
    requestParameters: RepostTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, trackId, metadata } = parseRequestParameters(
      'respostTrack',
      RepostTrackSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.REPOST,
      metadata: metadata && JSON.stringify(snakecaseKeys(metadata)),
      auth: this.auth,
      ...writeOptions
    })
  }

  /**
   * Unrepost a track
   */
  async unrepostTrack(
    requestParameters: UnrepostTrackRequest,
    writeOptions?: WriteOptions
  ) {
    // Parse inputs
    const { userId, trackId } = parseRequestParameters(
      'unrepostTrack',
      UnrepostTrackSchema
    )(requestParameters)

    return await this.entityManager.manageEntity({
      userId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.UNREPOST,
      auth: this.auth,
      ...writeOptions
    })
  }
}
