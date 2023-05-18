import { BaseAPI, BASE_PATH, RequiredError } from '../generated/default/runtime'

import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi
} from '../generated/default'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector'
import type { UploadTrackRequest } from './types'
import type { StorageService } from '../../services/Storage'
import { isFileValid } from '../../utils/file'
import { TRACK_REQUIRED_VALUES } from './constants'
import { objectMissingValues } from '../../utils/object'
import { retry3 } from '../../utils/retry'
import type { EntityManagerService, WalletApiService } from '../../services'
import { Action, EntityType } from '../../services/EntityManager/types'
import { decodeHashId } from '../../utils/hashId'
import { generateMetadataCidV1 } from '../../utils/cid'

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
  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService,
    private readonly entityManager: EntityManagerService,
    private readonly walletApi: WalletApiService
  ) {
    super(configuration)
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
  async uploadTrack(requestParameters: UploadTrackRequest) {
    const { trackFile, coverArtFile, metadata, onProgress } = requestParameters

    // Validate inputs
    if (!isFileValid(trackFile)) {
      throw new Error('Track file is not valid')
    }

    if (!isFileValid(coverArtFile)) {
      throw new Error('Cover art file is not valid')
    }

    if (typeof metadata !== 'object') {
      throw new Error('Metadata object is not valid')
    }

    const artistId = decodeHashId(requestParameters.artistId)
    if (artistId === null) {
      throw new Error('artistId is not valid')
    }

    requestParameters.metadata.owner_id = artistId

    const metadataMissingValues = objectMissingValues(
      requestParameters.metadata,
      TRACK_REQUIRED_VALUES
    )
    if (metadataMissingValues?.length) {
      throw new Error(
        `Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    // Upload track audio and cover art to storage node
    const [audioResp, coverArtResp] = await Promise.all([
      retry3(
        async () =>
          await this.storage.uploadFile({
            file: trackFile,
            onProgress,
            template: 'audio'
          }),
        (e) => {
          console.log('Retrying uploadTrackAudio', e)
        }
      ),
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
      )
    ])

    // Update metadata to include uploaded CIDs
    const updatedMetadata = {
      ...metadata,
      track_segments: [],
      track_cid: audioResp.results['320'],
      download: metadata.download?.is_downloadable
        ? {
            ...metadata.download,
            cid: metadata.track_cid
          }
        : metadata.download,
      cover_art_sizes: coverArtResp.id,
      duration: parseInt(audioResp.probe.format.duration, 10)
    }

    // Write metadata to chain

    const metadataCid = await generateMetadataCidV1(updatedMetadata)
    const trackId = await this.generateTrackId()
    const response = await this.entityManager.manageEntity({
      userId: artistId,
      entityType: EntityType.TRACK,
      entityId: trackId,
      action: Action.CREATE,
      metadata: JSON.stringify({
        cid: metadataCid.toString(),
        data: updatedMetadata
      }),
      walletApi: this.walletApi
    })
    const txReceipt = response.txReceipt

    return {
      blockHash: txReceipt.blockHash,
      blockNumber: txReceipt.blockNumber,
      trackId,
      transcodedTrackCID: updatedMetadata.track_cid,
      error: false
    }
  }

  private async generateTrackId() {
    const response = await this.request({
      path: `/tracks/unclaimed_id`,
      method: 'GET',
      headers: {},
      query: { noCache: Math.floor(Math.random() * 1000).toString() }
    })

    const { data } = await response.json()
    const id = decodeHashId(data)
    if (id === null) {
      throw new Error('Could not generate track id')
    }
    return id
  }
}
