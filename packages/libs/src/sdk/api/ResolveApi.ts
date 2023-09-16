import {
  JSONApiResponse,
  HTTPHeaders,
  RequiredError,
  BaseAPI,
  ResolveRequest
} from './generated/default'
import {
  instanceOfPlaylistResponse,
  instanceOfTrackResponse,
  PlaylistResponseFromJSON,
  TrackResponseFromJSON,
  UserResponseFromJSON
} from './generated/default/models'

// Extend that new class
export class ResolveApi extends BaseAPI {
  /**
   * Resolves a provided Audius app URL to the API resource it represents
   */
  async resolveRaw(params: ResolveRequest) {
    if (params.url === null || params.url === undefined) {
      throw new RequiredError(
        'url',
        'Required parameter params.url was null or undefined when calling resolve.'
      )
    }

    const queryParameters: any = {}

    if (params.url !== undefined) {
      queryParameters.url = params.url
    }

    const headerParameters: HTTPHeaders = {}

    const response = await this.request({
      path: `/resolve`,
      method: 'GET',
      headers: headerParameters,
      query: queryParameters
    })
    return new JSONApiResponse(response, (json) => {
      if (instanceOfTrackResponse(json)) {
        return TrackResponseFromJSON(json)
      } else if (instanceOfPlaylistResponse(json)) {
        return PlaylistResponseFromJSON(json)
      } else {
        return UserResponseFromJSON(json)
      }
    })
  }

  async resolve(params: ResolveRequest) {
    return await (await this.resolveRaw(params)).value()
  }
}
