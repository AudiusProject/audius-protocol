import { FingerprintClient } from '@audius/common/services'
import FingerprintJS, { Agent } from '@fingerprintjs/fingerprintjs-pro'

import { env } from './env'

const apiKey = env.FINGERPRINT_PUBLIC_API_KEY || ''
const endpoint = env.FINGERPRINT_ENDPOINT || ''
const identityService = env.IDENTITY_SERVICE || ''

export const fingerprintClient = new FingerprintClient<Agent>({
  apiKey,
  endpoint,
  identityService,
  initFingerprint: (apiKey, endpoint) => {
    return FingerprintJS.load({
      apiKey,
      endpoint
    })
  },
  getFingerprint: (client, { tag, linkedId }) => {
    return client.get({ tag, linkedId })
  }
})
