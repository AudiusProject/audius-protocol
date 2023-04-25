import { BASE_PATH, RequiredError } from '../generated/default/runtime'

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

// Subclass type masking adapted from Damir Arh's method:
// https://www.damirscorner.com/blog/posts/20190712-ChangeMethodSignatureInTypescriptSubclass.html
// Get the type of the generated TracksApi excluding streamTrack
type GeneratedTracksApiWithoutStream = new (config: Configuration) => {
  [P in Exclude<keyof GeneratedTracksApi, 'streamTrack'>]: GeneratedTracksApi[P]
}

// Create a new "class" that masks our generated TracksApi with the new type
const TracksApiWithoutStream: GeneratedTracksApiWithoutStream =
  GeneratedTracksApi

// Extend that new class
export class TracksApi extends TracksApiWithoutStream {
  constructor(
    configuration: Configuration,
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService,
    private readonly storage: StorageService
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

    requestParameters.metadata.owner_id = Number(requestParameters.artistId)

    const metadataMissingValues = objectMissingValues(
      requestParameters.metadata,
      TRACK_REQUIRED_VALUES
    )
    if (metadataMissingValues) {
      throw new Error(
        `Metadata object is missing values: ${metadataMissingValues}`
      )
    }

    // Upload track audio and cover art to storage node
    const [audioResp, coverArtResp] = await Promise.all([
      retry3(
        async () =>
          await this.storage.uploadFile(trackFile, onProgress, 'audio'),
        (e) => {
          console.log('Retrying uploadTrackAudio', e)
        }
      ),
      retry3(
        async () =>
          await this.storage.uploadFile(coverArtFile, onProgress, 'img_square'),
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
      cover_art_sizes: coverArtResp.id
    }

    // TODO: Integrate with wallet api
    // TODO: Write metadata to chain
    // const trackId = await this._generateTrackId()
    // const response = await this.contracts.EntityManagerClient!.manageEntity(
    //   ownerId,
    //   EntityManagerClient.EntityType.TRACK,
    //   trackId,
    //   EntityManagerClient.Action.CREATE,
    //   JSON.stringify({ cid: updatedMetadata.track_cid, data: updatedMetadata })
    // )
    // const txReceipt = response.txReceipt

    return {
      // blockHash: txReceipt.blockHash,
      // blockNumber: txReceipt.blockNumber,
      // trackId,
      transcodedTrackCID: updatedMetadata.track_cid,
      error: false
    }
  }
}
