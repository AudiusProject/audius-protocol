import { AudiusBackend, AuthHeaders } from '../audius-backend'

type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'

export type CognitoSignatureResponse = { signature: string }
export type CognitoFlowResponse = { shareable_url: string }
export type CognitoFlowExistsResponse = { exists: boolean }
type AuthHeadersType = typeof AuthHeaders
type MakeRequestConfig = {
  path: string
  method?: HttpMethod
  useAuth?: boolean
}

type CognitoConfig = {
  audiusBackend: AudiusBackend
}

export class Cognito {
  audiusBackend: AudiusBackend
  constructor(config: CognitoConfig) {
    this.audiusBackend = config.audiusBackend
  }

  _makeRequest = async <ResponseModel>(
    config: MakeRequestConfig
  ): Promise<ResponseModel> => {
    const { path, method = 'GET', useAuth = true } = config
    const options: {
      method: HttpMethod
      headers?: { [key in AuthHeadersType[keyof AuthHeadersType]]: string }
    } = { method }
    if (useAuth) {
      const libs = await this.audiusBackend.getAudiusLibs()
      const account = libs.Account.getCurrentUser()
      if (!account) {
        throw new Error('Cognito Identity Request Failed: Missing current user')
      }
      const { data, signature } = await this.audiusBackend.signData()
      options.headers = {
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      }
    }
    const response = await fetch(
      `${this.audiusBackend.identityServiceUrl}${path}`,
      options
    )
    if (response.status >= 400 && response.status < 600) {
      throw new Error(`Cognito Identity Request Failed: ${response.statusText}`)
    }
    const json: ResponseModel = await response.json()
    return json
  }

  getCognitoSignature = () =>
    this._makeRequest<CognitoSignatureResponse>({ path: '/cognito_signature' })

  getCognitoFlow = () =>
    this._makeRequest<CognitoFlowResponse>({
      path: '/cognito_flow',
      method: 'POST'
    })

  getCognitoExists = (handle: string) =>
    this._makeRequest<CognitoFlowExistsResponse>({
      path: `/cognito_recent_exists/${handle}`,
      method: 'GET',
      useAuth: false
    })
}
