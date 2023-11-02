import { FingerprintClient } from '@audius/common'
import FingerprintJS, { Agent } from '@fingerprintjs/fingerprintjs-pro'

const apiKey = process.env.VITE_FINGERPRINT_PUBLIC_API_KEY || ''
const endpoint = process.env.VITE_FINGERPRINT_ENDPOINT || ''
const identityService = process.env.VITE_IDENTITY_SERVICE || ''

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
