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
    private readonly discoveryNodeSelectorService: DiscoveryNodeSelectorService
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
   * Upload track using Storage V2
   */
  async uploadTrack(requestParameters: UploadTrackRequest) {
    // TODO: File validation

    // this.REQUIRES(Services.CREATOR_NODE) // TODO: Change to storage node
    // this.FILE_IS_VALID(trackFile)

    try {
      // if (coverArtFile) this.FILE_IS_VALID(coverArtFile)

      // this.IS_OBJECT(metadata)

      requestParameters.metadata.owner_id = Number(requestParameters.artistId)

      // TODO: Metadata validation
      // this._validateTrackMetadata(metadata)

      // Upload metadata
      const {
        // metadataMultihash,
        // metadataFileUUID,
        // transcodedTrackUUID,
        transcodedTrackCID
      } = await retry(
        async () => {
          console.log('trackFile', requestParameters.trackFile)
          // Upload track file
          const formData = new FormData()
          formData.append('template', 'audio')
          formData.append(
            'files',
            requestParameters.trackFile.buffer,
            requestParameters.trackFile.name
          )
          const response = await axios({
            method: 'post',
            // TODO: After the stack is better integrated, change to endpoint like this.creatorNodeEndpoint
            url: 'http://audius-protocol-creator-node-1/mediorum/uploads',
            data: formData,
            headers: {
              'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
            },
            onUploadProgress: requestParameters.onProgress
          })
          // const { id } = trackFileUploadResponseData[0]
          console.log('response', response)

          // TODO: Upload coverArtFile (same /storage/api/v1/file endpoint)

          // TODO: Need metadata to have track_cid, download.cid (if download.is_downloadable), and cover_art_sizes. I think we can stop doing the track_segments thing
          // TODO: Write metadata to EntityManager for both audio and cover art files, and probably return the tx receipt here
          // TODO: Make discovery stop calling /ipfs/<metadata_cid> and instead read from its own db where it already indexes this metadata
        },
        {
          // Retry function 3x
          // 1st retry delay = 500ms, 2nd = 1500ms, 3rd...nth retry = 4000 ms (capped)
          minTimeout: 500,
          maxTimeout: 4000,
          factor: 3,
          retries: 3,
          onRetry: (err) => {
            if (err) {
              console.log('uploadTrackContentV2 retry error: ', err)
            }
          }
        }
      )

      // Write metadata to chain
      // TODO: Make discovery index by reading its own db instead of hitting CN /ipfs
      // const trackId = await this._generateTrackId()
      // const response = await this.contracts.EntityManagerClient!.manageEntity(
      //   ownerId,
      //   EntityManagerClient.EntityType.TRACK,
      //   trackId,
      //   EntityManagerClient.Action.CREATE,
      //   metadataMultihash
      // )
      // const txReceipt = response.txReceipt

      return {
        // blockHash: txReceipt.blockHash,
        // blockNumber: txReceipt.blockNumber,
        // trackId,
        transcodedTrackCID,
        error: false
      }
    } catch (e) {
      return {
        error: (e as Error).message,
        stack: (e as Error).stack
      }
    }
  }
}
