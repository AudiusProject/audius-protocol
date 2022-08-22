import { FingerprintClient } from '@audius/common'

const apiKey = process.env.REACT_APP_FINGERPRINT_PUBLIC_API_KEY || ''
const endpoint = process.env.REACT_APP_FINGERPRINT_ENDPOINT || ''
const identityService = process.env.REACT_APP_IDENTITY_SERVICE || ''

export const fingerprintClient = new FingerprintClient({
  apiKey,
  endpoint,
  identityService
})
