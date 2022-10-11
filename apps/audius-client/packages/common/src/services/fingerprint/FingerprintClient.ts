type FingerprintClientConfig<TFingerprintClient> = {
  apiKey: string
  endpoint: string
  identityService: string
  initFingerprint: (
    apiKey: string,
    endpoint: string
  ) => Promise<TFingerprintClient>
  getFingerprint: (
    client: TFingerprintClient,
    options: { linkedId: string; tag: any }
  ) => Promise<any>
}

export class FingerprintClient<TFingerprintClient> {
  private apiKey: string
  private fingerprint: TFingerprintClient | null
  private endpoint: string
  private identityService: string
  private initFingerprint: (
    apiKey: string,
    endpoint: string
  ) => Promise<TFingerprintClient>

  private getFingerprint: (
    client: TFingerprintClient,
    options: { linkedId: string; tag: any }
  ) => Promise<any>

  constructor(config: FingerprintClientConfig<TFingerprintClient>) {
    const {
      apiKey,
      endpoint,
      identityService,
      initFingerprint,
      getFingerprint
    } = config
    this.apiKey = apiKey
    this.fingerprint = null
    this.endpoint = endpoint
    this.identityService = identityService
    this.initFingerprint = initFingerprint
    this.getFingerprint = getFingerprint
  }

  async init() {
    try {
      const fp = await this.initFingerprint(this.apiKey, this.endpoint)
      this.fingerprint = fp
    } catch (e) {
      console.error(`Error initializing fingerprint client: ${e}`)
    }
  }

  async identify(userId: number, clientOrigin: 'desktop' | 'mobile' | 'web') {
    if (!this.fingerprint) {
      console.warn('Fingerprint client not yet initted')
      return
    }
    try {
      // First, see if we've fingerprinted this user before
      const response = await fetch(
        `${this.identityService}/fp?userId=${userId}&origin=${clientOrigin}`
      )

      if (response.status !== 200) {
        console.error(
          `Got status code ${response.status} from identity during fingerprint`
        )
        return
      }
      const { count } = await response.json()

      if (count >= 1) {
        return
      }

      // If we haven't, fingerprint 'em
      await this.getFingerprint(this.fingerprint, {
        linkedId: userId.toString(),
        tag: { origin: clientOrigin }
      })
    } catch (e) {
      console.error(`Error identifying fingerprint client: ${e}`)
    }
  }
}
