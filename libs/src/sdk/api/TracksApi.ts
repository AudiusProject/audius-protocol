import type { DiscoveryProvider } from '../../services/discoveryProvider'
import { BASE_PATH, RequiredError } from './generated/default/runtime'

import {
  Configuration,
  StreamTrackRequest,
  TracksApi as GeneratedTracksApi
} from './generated/default'

/**
 * This class extends from the generated TracksApi to
 * implement the custom logic for the `streamTrack` endpoint
 */
export class TracksApi extends GeneratedTracksApi {
  discoveryNode: DiscoveryProvider

  constructor(configuration: Configuration, discoveryNode: DiscoveryProvider) {
    super(configuration)
    this.discoveryNode = discoveryNode
  }

  /**
   * Get the track's streamable mp3 file
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
    const host = await this.discoveryNode.getHealthyDiscoveryProviderEndpoint(0)
    return `${host}${BASE_PATH}${path}`
  }
}
