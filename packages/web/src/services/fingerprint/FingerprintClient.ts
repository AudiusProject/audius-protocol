import FingerprintJS, { Agent } from '@fingerprintjs/fingerprintjs-pro'

import { isElectron, isMobile } from 'utils/clientUtil'

const IDENTITY_SERVICE = process.env.REACT_APP_IDENTITY_SERVICE

class FingerprintClient {
  private apiKey: string
  private fingerprint: Agent | null
  private endpoint: string

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey
    this.fingerprint = null
    this.endpoint = endpoint
  }

  async init() {
    console.log('Initializing Fingerprint client')
    try {
      const fp = await FingerprintJS.load({
        apiKey: this.apiKey,
        endpoint: this.endpoint
      })
      console.log(`Fingerprint loaded`)
      this.fingerprint = fp
    } catch (e) {
      console.error(`Error initializing fingerprint client: ${e}`)
    }
  }

  async identify(userId: number) {
    if (!this.fingerprint) {
      console.warn('Fingerprint client not yet initted')
      return
    }
    try {
      const origin = isMobile() ? 'mobile' : isElectron() ? 'desktop' : 'web'

      // First, see if we've fingerprinted this user before
      const response = await fetch(
        `${IDENTITY_SERVICE}/fp?userId=${userId}&origin=${origin}`
      )

      if (response.status !== 200) {
        console.error(
          `Got status code ${response.status} from identity during fingerprint`
        )
        return
      }
      const { count } = await response.json()

      if (count >= 1) {
        console.log('Previously fingerprinted this user<>platform')
        return
      }

      // If we haven't, fingerprint 'em
      await this.fingerprint.get({
        linkedId: userId.toString(),
        tag: { origin }
      })
      console.log('Fingerprint identify')
    } catch (e) {
      console.error(`Error identifying fingerprint client: ${e}`)
    }
  }
}

const apiKey = process.env.REACT_APP_FINGERPRINT_PUBLIC_API_KEY || ''
const endpoint = process.env.REACT_APP_FINGERPRINT_ENDPOINT || ''
const client = new FingerprintClient(apiKey, endpoint)

export default client
