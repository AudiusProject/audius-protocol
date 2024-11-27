import { AuthHeaders } from '@audius/common/services'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { audiusSdk } from 'services/audius-sdk'

// @ts-ignore
const libs = () => window.audiusLibs

type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'

export type CognitoSignatureResponse = { signature: string }
export type CognitoFlowResponse = { shareable_url: string }
type CognitoFlowExistsResponse = { exists: boolean }
type AuthHeadersType = typeof AuthHeaders

async function _makeRequest<ResponseModel>({
  path,
  method = 'GET',
  useAuth = true
}: {
  path: string
  method?: HttpMethod
  useAuth?: boolean
}): Promise<ResponseModel> {
  const options: {
    method: HttpMethod
    headers?: { [key in AuthHeadersType[keyof AuthHeadersType]]: string }
  } = { method }
  if (useAuth) {
    await waitForLibsInit()
    const account = libs()?.getCurrentUser()
    if (!account) {
      throw new Error('Cognito Identity Request Failed: Missing current user')
    }
    const sdk = await audiusSdk()
    const { data, signature } =
      await audiusBackendInstance.signIdentityServiceRequest({ sdk })
    options.headers = {
      [AuthHeaders.Message]: data,
      [AuthHeaders.Signature]: signature
    }
  }
  const response = await fetch(
    `${audiusBackendInstance.identityServiceUrl}${path}`,
    options
  )
  if (response.status >= 400 && response.status < 600) {
    throw new Error(`Cognito Identity Request Failed: ${response.statusText}`)
  }
  const json: ResponseModel = await response.json()
  return json
}

export const getCognitoSignature = () =>
  _makeRequest<CognitoSignatureResponse>({ path: '/cognito_signature' })

export const getCognitoFlow = () =>
  _makeRequest<CognitoFlowResponse>({ path: '/cognito_flow', method: 'POST' })

export const getCognitoExists = (handle: string) =>
  _makeRequest<CognitoFlowExistsResponse>({
    path: `/cognito_recent_exists/${handle}`,
    method: 'GET',
    useAuth: false
  })
