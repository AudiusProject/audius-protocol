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
  private initFingerprint: (
    apiKey: string,
    endpoint: string
  ) => Promise<TFingerprintClient>

  private getFingerprint: (
    client: TFingerprintClient,
    options: { linkedId: string; tag: any }
  ) => Promise<any>

  constructor(config: FingerprintClientConfig<TFingerprintClient>) {
    const { apiKey, endpoint, initFingerprint, getFingerprint } = config
    this.apiKey = apiKey
    this.fingerprint = null
    this.endpoint = endpoint
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

  async identify(email: string, clientOrigin: 'desktop' | 'mobile' | 'web') {
    if (!this.fingerprint) {
      console.warn('Fingerprint client not yet initted')
      return
    }
    try {
      return await this.getFingerprint(this.fingerprint, {
        linkedId: email,
        tag: { origin: clientOrigin }
      })
    } catch (e) {
      console.error(`Error identifying fingerprint client: ${e}`)
    }
  }
}
