import type { AuthService } from './types'

const NOT_INITIALIZED =
  'Auth not initialized - Please provide an apiKey and apiSecret, or a custom implementation of Auth'

export class DefaultAuth implements AuthService {
  private readonly apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey?.replace(/^0x/, '') ?? null
  }

  getSharedSecret = () => {
    throw new Error(NOT_INITIALIZED)
  }

  sign = () => {
    throw new Error(NOT_INITIALIZED)
  }

  hashAndSign = () => {
    throw new Error(NOT_INITIALIZED)
  }

  signTransaction = () => {
    throw new Error(NOT_INITIALIZED)
  }

  getAddress: () => Promise<string> = async () => {
    if (!this.apiKey) {
      throw new Error(NOT_INITIALIZED)
    }
    return `0x${this.apiKey}`
  }
}
