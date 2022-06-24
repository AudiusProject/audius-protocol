import {
  HTTPHeaders,
  Playlist,
  RequiredError,
  Track,
  User
} from './generated/default'
import {
  ResolveApi as GeneratedResolveApi,
  ResolveRequest
} from './generated/default/apis/ResolveApi'

export class ResolveApi extends GeneratedResolveApi {
  /**
   * Resolves a provided Audius app URL to the API resource it represents
   */
  async resolve<T extends Track | Playlist | User>(
    requestParameters: ResolveRequest
  ): Promise<T> {
    if (requestParameters.url === null || requestParameters.url === undefined) {
      throw new RequiredError(
        'trackId',
        'Required parameter requestParameters.url was null or undefined when calling resolve.'
      )
    }

    const queryParameters: any = {}

    if (requestParameters.url !== undefined) {
      queryParameters.url = requestParameters.url
    }

    const headerParameters: HTTPHeaders = {}

    return await this.request({
      path: `/resolve`,
      method: 'GET',
      headers: headerParameters,
      query: queryParameters
    })
  }
}
