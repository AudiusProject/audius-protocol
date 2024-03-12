import { FingerprintClient } from '@audius/common/services'
import { FingerprintJsProAgent } from '@fingerprintjs/fingerprintjs-pro-react-native'

import { env } from 'app/env'

const apiKey = env.FINGERPRINT_PUBLIC_API_KEY || ''
const endpoint = env.FINGERPRINT_ENDPOINT || ''
const identityService = env.IDENTITY_SERVICE || ''

export const fingerprintClient = new FingerprintClient<FingerprintJsProAgent>({
  apiKey,
  endpoint,
  identityService,
  initFingerprint: async (apiKey, endpoint) => {
    return new FingerprintJsProAgent({ apiKey, endpointUrl: endpoint })
  },
  getFingerprint: (client, { tag, linkedId }) => {
    return client.getVisitorId(tag, linkedId)
  }
})
