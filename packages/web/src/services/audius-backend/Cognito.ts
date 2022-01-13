import AudiusBackend, {
  AuthHeaders,
  IDENTITY_SERVICE
} from 'services/AudiusBackend'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

// @ts-ignore
const libs = () => window.audiusLibs

type HttpMethod = 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'

export type CognitoSignatureResponse = { signature: string }
export type CognitoFlowResponse = { shareable_url: string }

async function _makeRequest<ResponseModel>({
  path,
  method = 'GET'
}: {
  path: string
  method?: HttpMethod
}): Promise<ResponseModel> {
  await waitForLibsInit()
  const account = libs().Account.getCurrentUser()
  if (!account) {
    throw new Error('Cognito Identity Request Failed: Missing current user')
  }
  const { data, signature } = await AudiusBackend.signData()
  const response = await fetch(`${IDENTITY_SERVICE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      [AuthHeaders.Message]: data,
      [AuthHeaders.Signature]: signature
    }
  })
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
