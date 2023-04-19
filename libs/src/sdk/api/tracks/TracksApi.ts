import { BASE_PATH, RequiredError } from '../generated/default/runtime'
import FormData from 'form-data'

import retry from 'async-retry'
import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi
} from '../generated/default'
import type { DiscoveryNodeSelectorService } from '../../services/DiscoveryNodeSelector'
import axios from 'axios'
import type { UploadTrackRequest } from './types'
import { StorageService } from '../../services/StorageService'

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

  async uploadTrack(requestParameters: UploadTrackRequest) {
    // TODO: Validate inputs
    // this.REQUIRES(Services.CREATOR_NODE)
    // this.FILE_IS_VALID(trackFile)
    // if (coverArtFile) this.FILE_IS_VALID(coverArtFile)
    // this.IS_OBJECT(metadata)

    // TODO: Integrate with wallet api
    // const ownerId = this.userStateManager.getCurrentUserId()
    // if (!ownerId) {
    //   return {
    //     error: 'No users loaded for this wallet'
    //   }
    // }
    requestParameters.metadata.owner_id = Number(requestParameters.artistId)
    // this._validateTrackMetadata(metadata)

    // Upload track audio and cover art to storage node
    const updatedMetadata = await this.storage.uploadTrackAudioAndCoverArt(
      requestParameters.trackFile,
      requestParameters.coverArtFile,
      requestParameters.metadata,
      requestParameters.onProgress
    )

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
